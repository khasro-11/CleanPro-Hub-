import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/client";
import { differenceInMinutes, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";
import type { CheckInInput, CheckOutInput, TimeEntryListQuery } from "@/types/time-entry.schema";

const TIME_ENTRY_INCLUDE = {
  employee: { select: { id: true, firstName: true, lastName: true, photoUrl: true } },
  job: { select: { id: true, title: true } },
} as const;

export type TimeEntryWithDetails = Prisma.TimeEntryGetPayload<{ include: typeof TIME_ENTRY_INCLUDE }>;

export async function getActiveEntry(employeeId: string) {
  return prisma.timeEntry.findFirst({
    where: { employeeId, checkOut: null },
    include: TIME_ENTRY_INCLUDE,
    orderBy: { checkIn: "desc" },
  });
}

export async function checkIn(data: CheckInInput) {
  return prisma.timeEntry.create({
    data: {
      employeeId: data.employeeId,
      jobId: data.jobId,
      checkIn: new Date(),
      latLng: data.latLng,
      notes: data.notes,
    },
    include: TIME_ENTRY_INCLUDE,
  });
}

export async function checkOut(id: string, data: CheckOutInput) {
  const entry = await prisma.timeEntry.findUnique({ where: { id } });
  if (!entry) return null;

  const checkOutTime = new Date();
  const durationMin = differenceInMinutes(checkOutTime, entry.checkIn);

  return prisma.timeEntry.update({
    where: { id },
    data: {
      checkOut: checkOutTime,
      durationMin,
      notes: data.notes ?? entry.notes,
    },
    include: TIME_ENTRY_INCLUDE,
  });
}

export async function listTimeEntries(query: TimeEntryListQuery) {
  const { page, limit, employeeId, jobId, from, to, activeOnly, sortOrder } = query;
  const skip = (page - 1) * limit;

  const where: Prisma.TimeEntryWhereInput = {
    ...(employeeId && { employeeId }),
    ...(jobId && { jobId }),
    ...(activeOnly && { checkOut: null }),
    ...((from || to) && {
      checkIn: {
        ...(from && { gte: new Date(from) }),
        ...(to && { lte: endOfDay(new Date(to)) }),
      },
    }),
  };

  const [entries, total] = await prisma.$transaction([
    prisma.timeEntry.findMany({
      where,
      include: TIME_ENTRY_INCLUDE,
      orderBy: { checkIn: sortOrder },
      skip,
      take: limit,
    }),
    prisma.timeEntry.count({ where }),
  ]);

  return { entries, total, page, limit };
}

export async function getAllActiveEntries() {
  const todayStart = startOfDay(new Date());
  return prisma.timeEntry.findMany({
    where: {
      checkOut: null,
      checkIn: { gte: todayStart },
    },
    include: TIME_ENTRY_INCLUDE,
    orderBy: { checkIn: "desc" },
  });
}

export async function getEmployeeHoursSummaryForEntry(employeeId: string) {
  const now = new Date();

  const [week, month, allTime] = await Promise.all([
    prisma.timeEntry.aggregate({
      where: {
        employeeId,
        checkIn: { gte: startOfWeek(now, { weekStartsOn: 1 }), lte: endOfWeek(now, { weekStartsOn: 1 }) },
        durationMin: { not: null },
      },
      _sum: { durationMin: true },
    }),
    prisma.timeEntry.aggregate({
      where: {
        employeeId,
        checkIn: { gte: startOfMonth(now), lte: endOfMonth(now) },
        durationMin: { not: null },
      },
      _sum: { durationMin: true },
    }),
    prisma.timeEntry.aggregate({
      where: { employeeId, durationMin: { not: null } },
      _sum: { durationMin: true },
    }),
  ]);

  return {
    weekMinutes: week._sum.durationMin ?? 0,
    monthMinutes: month._sum.durationMin ?? 0,
    totalMinutes: allTime._sum.durationMin ?? 0,
  };
}

export async function getEmployeeByUserId(userId: string) {
  return prisma.employee.findUnique({
    where: { userId },
    select: { id: true, firstName: true, lastName: true },
  });
}

export async function listTimeEntriesForExport(employeeId?: string, from?: string, to?: string) {
  const where: Prisma.TimeEntryWhereInput = {
    checkOut: { not: null },
    ...(employeeId && { employeeId }),
    ...((from || to) && {
      checkIn: {
        ...(from && { gte: new Date(from) }),
        ...(to && { lte: endOfDay(new Date(to)) }),
      },
    }),
  };

  return prisma.timeEntry.findMany({
    where,
    include: {
      employee: { select: { firstName: true, lastName: true } },
      job: { select: { title: true } },
    },
    orderBy: [{ employee: { lastName: "asc" } }, { checkIn: "asc" }],
  });
}
