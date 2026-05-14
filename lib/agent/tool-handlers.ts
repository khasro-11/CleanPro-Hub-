import { prisma } from "@/lib/db/client";
import { startOfMonth, endOfMonth } from "date-fns";

export type ToolResult = { ok: true; data: unknown } | { ok: false; error: string };

// ──────────────────────────────────────────────────────────────
// listCustomers
// ──────────────────────────────────────────────────────────────
export async function handleListCustomers(input: {
  search?: string;
  status?: string;
  customerType?: string;
  limit?: number;
}): Promise<ToolResult> {
  const limit = Math.min(input.limit ?? 10, 20);
  const customers = await prisma.customer.findMany({
    where: {
      deletedAt: null,
      ...(input.status && { status: input.status as never }),
      ...(input.customerType && { customerType: input.customerType as never }),
      ...(input.search && {
        OR: [
          { name: { contains: input.search, mode: "insensitive" } },
          { company: { contains: input.search, mode: "insensitive" } },
          { city: { contains: input.search, mode: "insensitive" } },
          { email: { contains: input.search, mode: "insensitive" } },
        ],
      }),
    },
    select: {
      id: true,
      name: true,
      company: true,
      city: true,
      customerType: true,
      contractType: true,
      status: true,
      hourlyRate: true,
      flatRate: true,
      _count: { select: { jobs: true } },
    },
    take: limit,
    orderBy: { name: "asc" },
  });
  return { ok: true, data: customers };
}

// ──────────────────────────────────────────────────────────────
// createCustomer
// ──────────────────────────────────────────────────────────────
export async function handleCreateCustomer(input: {
  name: string;
  company?: string;
  street: string;
  zip: string;
  city: string;
  phone?: string;
  email?: string;
  customerType: string;
  contractType: string;
  hourlyRate?: number;
  flatRate?: number;
  notes?: string;
}): Promise<ToolResult> {
  const customer = await prisma.customer.create({
    data: {
      name: input.name,
      company: input.company,
      street: input.street,
      zip: input.zip,
      city: input.city,
      phone: input.phone,
      email: input.email,
      customerType: input.customerType as never,
      contractType: input.contractType as never,
      hourlyRate: input.hourlyRate ?? undefined,
      flatRate: input.flatRate ?? undefined,
      notes: input.notes,
    },
    select: { id: true, name: true, city: true, customerType: true, contractType: true },
  });
  return { ok: true, data: customer };
}

// ──────────────────────────────────────────────────────────────
// updateCustomer
// ──────────────────────────────────────────────────────────────
export async function handleUpdateCustomer(input: {
  id: string;
  name?: string;
  company?: string;
  street?: string;
  zip?: string;
  city?: string;
  phone?: string;
  email?: string;
  customerType?: string;
  contractType?: string;
  hourlyRate?: number;
  flatRate?: number;
  status?: string;
  notes?: string;
}): Promise<ToolResult> {
  const { id, ...rest } = input;
  const exists = await prisma.customer.findUnique({ where: { id, deletedAt: null } });
  if (!exists) return { ok: false, error: `Kunde mit ID "${id}" nicht gefunden.` };

  const updated = await prisma.customer.update({
    where: { id },
    data: {
      ...rest,
      customerType: rest.customerType as never,
      contractType: rest.contractType as never,
      status: rest.status as never,
    },
    select: { id: true, name: true, city: true, status: true },
  });
  return { ok: true, data: updated };
}

// ──────────────────────────────────────────────────────────────
// listEmployees
// ──────────────────────────────────────────────────────────────
export async function handleListEmployees(input: {
  search?: string;
  status?: string;
  contractType?: string;
  limit?: number;
}): Promise<ToolResult> {
  const limit = Math.min(input.limit ?? 10, 20);
  const employees = await prisma.employee.findMany({
    where: {
      deletedAt: null,
      ...(input.status && { status: input.status as never }),
      ...(input.contractType && { contractType: input.contractType as never }),
      ...(input.search && {
        OR: [
          { firstName: { contains: input.search, mode: "insensitive" } },
          { lastName: { contains: input.search, mode: "insensitive" } },
          { email: { contains: input.search, mode: "insensitive" } },
          { city: { contains: input.search, mode: "insensitive" } },
        ],
      }),
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      contractType: true,
      status: true,
      weeklyHours: true,
    },
    take: limit,
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });
  return { ok: true, data: employees };
}

// ──────────────────────────────────────────────────────────────
// createEmployee
// ──────────────────────────────────────────────────────────────
export async function handleCreateEmployee(input: {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  street?: string;
  zip?: string;
  city?: string;
  contractType: string;
  hourlyWage?: number;
  weeklyHours?: number;
  startDate?: string;
}): Promise<ToolResult> {
  const employee = await prisma.employee.create({
    data: {
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      phone: input.phone,
      street: input.street,
      zip: input.zip,
      city: input.city,
      contractType: input.contractType as never,
      hourlyWage: input.hourlyWage ?? undefined,
      weeklyHours: input.weeklyHours,
      startDate: input.startDate ? new Date(input.startDate) : undefined,
    },
    select: { id: true, firstName: true, lastName: true, contractType: true, status: true },
  });
  return { ok: true, data: employee };
}

// ──────────────────────────────────────────────────────────────
// scheduleJob
// ──────────────────────────────────────────────────────────────
export async function handleScheduleJob(input: {
  customerId: string;
  employeeIds: string[];
  title: string;
  scheduledAt: string;
  duration: number;
  recurrence?: string;
  description?: string;
  notes?: string;
}): Promise<ToolResult> {
  const customer = await prisma.customer.findUnique({
    where: { id: input.customerId, deletedAt: null },
    select: { id: true, name: true },
  });
  if (!customer) return { ok: false, error: `Kunde mit ID "${input.customerId}" nicht gefunden.` };

  const job = await prisma.job.create({
    data: {
      title: input.title,
      customerId: input.customerId,
      scheduledAt: new Date(input.scheduledAt),
      duration: input.duration,
      recurrence: (input.recurrence ?? "EINMALIG") as never,
      description: input.description,
      notes: input.notes,
      assignments: {
        create: input.employeeIds.map((id) => ({ employeeId: id })),
      },
    },
    select: {
      id: true,
      title: true,
      scheduledAt: true,
      duration: true,
      status: true,
      customer: { select: { name: true } },
    },
  });
  return { ok: true, data: job };
}

// ──────────────────────────────────────────────────────────────
// getEmployeeHours
// ──────────────────────────────────────────────────────────────
export async function handleGetEmployeeHours(input: {
  employeeId: string;
  from: string;
  to: string;
}): Promise<ToolResult> {
  const employee = await prisma.employee.findUnique({
    where: { id: input.employeeId, deletedAt: null },
    select: { firstName: true, lastName: true },
  });
  if (!employee) return { ok: false, error: `Mitarbeiter mit ID "${input.employeeId}" nicht gefunden.` };

  const entries = await prisma.timeEntry.findMany({
    where: {
      employeeId: input.employeeId,
      checkIn: { gte: new Date(input.from), lte: new Date(input.to) },
      durationMin: { not: null },
    },
    select: { durationMin: true, checkIn: true },
  });

  const totalMinutes = entries.reduce((sum, e) => sum + (e.durationMin ?? 0), 0);
  const totalHours = Math.round((totalMinutes / 60) * 100) / 100;

  return {
    ok: true,
    data: {
      employee: `${employee.firstName} ${employee.lastName}`,
      from: input.from,
      to: input.to,
      totalMinutes,
      totalHours,
      sessions: entries.length,
    },
  };
}

// ──────────────────────────────────────────────────────────────
// generateMonthlyReport
// ──────────────────────────────────────────────────────────────
export async function handleGenerateMonthlyReport(input: {
  month: number;
  year: number;
}): Promise<ToolResult> {
  const start = startOfMonth(new Date(input.year, input.month - 1, 1));
  const end = endOfMonth(start);

  const [jobs, timeEntries] = await Promise.all([
    prisma.job.findMany({
      where: { deletedAt: null, scheduledAt: { gte: start, lte: end } },
      include: { customer: { select: { flatRate: true, hourlyRate: true, name: true } } },
    }),
    prisma.timeEntry.findMany({
      where: {
        checkIn: { gte: start, lte: end },
        durationMin: { not: null },
      },
      select: { durationMin: true, employeeId: true },
    }),
  ]);

  const completedJobs = jobs.filter((j) => j.status === "ABGESCHLOSSEN");
  const cancelledJobs = jobs.filter((j) => j.status === "ABGESAGT");

  const revenue = completedJobs.reduce((sum, job) => {
    const flat = job.customer.flatRate ? Number(job.customer.flatRate) : 0;
    const hourly = job.customer.hourlyRate
      ? Number(job.customer.hourlyRate) * (job.duration / 60)
      : 0;
    return sum + (flat || hourly);
  }, 0);

  const totalMinutesWorked = timeEntries.reduce((sum, e) => sum + (e.durationMin ?? 0), 0);
  const uniqueEmployees = new Set(timeEntries.map((e) => e.employeeId)).size;

  return {
    ok: true,
    data: {
      period: `${String(input.month).padStart(2, "0")}.${input.year}`,
      totalJobs: jobs.length,
      completedJobs: completedJobs.length,
      cancelledJobs: cancelledJobs.length,
      revenueEur: Math.round(revenue * 100) / 100,
      totalHoursWorked: Math.round((totalMinutesWorked / 60) * 100) / 100,
      activeEmployees: uniqueEmployees,
    },
  };
}

// ──────────────────────────────────────────────────────────────
// findAvailableEmployee
// ──────────────────────────────────────────────────────────────
export async function handleFindAvailableEmployee(input: {
  datetime: string;
  duration: number;
}): Promise<ToolResult> {
  const startDt = new Date(input.datetime);
  const endDt = new Date(startDt.getTime() + input.duration * 60 * 1000);

  const allActive = await prisma.employee.findMany({
    where: { deletedAt: null, status: "AKTIV" },
    select: { id: true, firstName: true, lastName: true, contractType: true, weeklyHours: true },
  });

  // Find employees with overlapping job assignments
  const busyAssignments = await prisma.jobAssignment.findMany({
    where: {
      job: {
        deletedAt: null,
        status: { in: ["GEPLANT", "IN_BEARBEITUNG"] },
        scheduledAt: { lt: endDt },
        AND: [
          {
            scheduledAt: {
              gte: new Date(startDt.getTime() - 24 * 60 * 60 * 1000),
            },
          },
        ],
      },
    },
    include: { job: { select: { scheduledAt: true, duration: true } } },
  });

  const busyEmployeeIds = new Set(
    busyAssignments
      .filter((a) => {
        const jobEnd = new Date(a.job.scheduledAt.getTime() + a.job.duration * 60 * 1000);
        return a.job.scheduledAt < endDt && jobEnd > startDt;
      })
      .map((a) => a.employeeId)
  );

  const available = allActive.filter((e) => !busyEmployeeIds.has(e.id));

  return {
    ok: true,
    data: {
      requestedDatetime: input.datetime,
      durationMinutes: input.duration,
      availableCount: available.length,
      employees: available,
    },
  };
}
