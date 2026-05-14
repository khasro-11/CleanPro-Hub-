import { prisma } from "@/lib/db/client";
import {
  startOfDay, endOfDay, addDays,
  startOfMonth, subMonths, format,
} from "date-fns";

export async function getDashboardKpis() {
  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);

  const [
    totalCustomers,
    activeCustomers,
    totalEmployees,
    activeEmployees,
    todayJobs,
    openJobs,
    monthRevenue,
    prevMonthRevenue,
  ] = await Promise.all([
    prisma.customer.count({ where: { deletedAt: null } }),
    prisma.customer.count({ where: { deletedAt: null, status: "AKTIV" } }),
    prisma.employee.count({ where: { deletedAt: null } }),
    prisma.employee.count({ where: { deletedAt: null, status: "AKTIV" } }),
    prisma.job.count({
      where: {
        deletedAt: null,
        scheduledAt: { gte: todayStart, lte: todayEnd },
      },
    }),
    prisma.job.count({
      where: {
        deletedAt: null,
        status: { in: ["GEPLANT", "IN_BEARBEITUNG"] },
      },
    }),
    // Revenue = sum of flatRate or hourlyRate * (duration/60) for completed jobs this month
    prisma.job.findMany({
      where: {
        deletedAt: null,
        status: "ABGESCHLOSSEN",
        scheduledAt: { gte: startOfMonth(now) },
      },
      include: { customer: { select: { flatRate: true, hourlyRate: true } } },
    }),
    prisma.job.findMany({
      where: {
        deletedAt: null,
        status: "ABGESCHLOSSEN",
        scheduledAt: {
          gte: startOfMonth(subMonths(now, 1)),
          lt: startOfMonth(now),
        },
      },
      include: { customer: { select: { flatRate: true, hourlyRate: true } } },
    }),
  ]);

  function calcRevenue(jobs: typeof monthRevenue) {
    return jobs.reduce((sum, job) => {
      const flat = job.customer.flatRate ? Number(job.customer.flatRate) : 0;
      const hourly = job.customer.hourlyRate
        ? Number(job.customer.hourlyRate) * (job.duration / 60)
        : 0;
      return sum + (flat || hourly);
    }, 0);
  }

  const currentRevenue = calcRevenue(monthRevenue);
  const previousRevenue = calcRevenue(prevMonthRevenue);
  const revenueTrend =
    previousRevenue > 0
      ? Math.round(((currentRevenue - previousRevenue) / previousRevenue) * 100)
      : null;

  return {
    customers: { total: totalCustomers, active: activeCustomers },
    employees: { total: totalEmployees, active: activeEmployees },
    jobs: { today: todayJobs, open: openJobs },
    revenue: { current: currentRevenue, trend: revenueTrend },
  };
}

export async function getTodayJobs() {
  const now = new Date();
  return prisma.job.findMany({
    where: {
      deletedAt: null,
      scheduledAt: { gte: startOfDay(now), lte: endOfDay(now) },
    },
    include: {
      customer: { select: { id: true, name: true } },
      assignments: {
        include: {
          employee: { select: { id: true, firstName: true, lastName: true } },
        },
      },
    },
    orderBy: { scheduledAt: "asc" },
  });
}

export async function getUpcomingJobs() {
  const now = new Date();
  const in7days = endOfDay(addDays(now, 6));
  return prisma.job.findMany({
    where: {
      deletedAt: null,
      status: { in: ["GEPLANT", "IN_BEARBEITUNG"] },
      scheduledAt: { gt: endOfDay(now), lte: in7days },
    },
    include: {
      customer: { select: { id: true, name: true } },
    },
    orderBy: { scheduledAt: "asc" },
    take: 10,
  });
}

export async function getEmployeeHoursChartData() {
  // Hours per active employee — last 4 weeks
  const since = startOfDay(addDays(new Date(), -28));

  const entries = await prisma.timeEntry.findMany({
    where: {
      checkIn: { gte: since },
      durationMin: { not: null },
      employee: { deletedAt: null, status: "AKTIV" },
    },
    include: {
      employee: { select: { id: true, firstName: true, lastName: true } },
    },
  });

  const map = new Map<string, { name: string; minutes: number }>();
  for (const e of entries) {
    const key = e.employeeId;
    const existing = map.get(key);
    if (existing) {
      existing.minutes += e.durationMin ?? 0;
    } else {
      map.set(key, {
        name: `${e.employee.firstName} ${e.employee.lastName}`,
        minutes: e.durationMin ?? 0,
      });
    }
  }

  return Array.from(map.values())
    .map((d) => ({ name: d.name, stunden: Math.round(d.minutes / 60) }))
    .sort((a, b) => b.stunden - a.stunden)
    .slice(0, 10);
}

export async function getRevenueChartData() {
  // Monthly revenue for the last 12 months
  const months: { month: string; umsatz: number }[] = [];
  const now = new Date();

  for (let i = 11; i >= 0; i--) {
    const monthStart = startOfMonth(subMonths(now, i));
    const monthEnd = startOfMonth(subMonths(now, i - 1));

    const jobs = await prisma.job.findMany({
      where: {
        deletedAt: null,
        status: "ABGESCHLOSSEN",
        scheduledAt: { gte: monthStart, lt: monthEnd },
      },
      include: { customer: { select: { flatRate: true, hourlyRate: true } } },
    });

    const umsatz = jobs.reduce((sum, job) => {
      const flat = job.customer.flatRate ? Number(job.customer.flatRate) : 0;
      const hourly = job.customer.hourlyRate
        ? Number(job.customer.hourlyRate) * (job.duration / 60)
        : 0;
      return sum + (flat || hourly);
    }, 0);

    months.push({ month: format(monthStart, "MMM yy"), umsatz: Math.round(umsatz) });
  }

  return months;
}
