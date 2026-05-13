import { Prisma, RecurrenceType } from "@prisma/client";
import { addDays, addWeeks, addMonths } from "date-fns";
import { prisma } from "@/lib/db/client";
import type { JobFormData, JobListQuery } from "@/types/job.schema";

const JOB_INCLUDE = {
  customer: { select: { id: true, name: true, company: true } },
  assignments: {
    include: {
      employee: { select: { id: true, firstName: true, lastName: true, photoUrl: true } },
    },
  },
} as const;

export type JobWithDetails = Prisma.JobGetPayload<{ include: typeof JOB_INCLUDE }>;

export async function listJobs(query: JobListQuery) {
  const { page, limit, search, status, customerId, employeeId, from, to, sortBy, sortOrder } = query;
  const skip = (page - 1) * limit;

  const where: Prisma.JobWhereInput = {
    deletedAt: null,
    ...(status && { status }),
    ...(customerId && { customerId }),
    ...(employeeId && { assignments: { some: { employeeId } } }),
    ...(from && { scheduledAt: { gte: new Date(from) } }),
    ...(to && { scheduledAt: { lte: new Date(to) } }),
    ...(search && {
      OR: [
        { title: { contains: search, mode: "insensitive" } },
        { customer: { name: { contains: search, mode: "insensitive" } } },
      ],
    }),
  };

  const [jobs, total] = await prisma.$transaction([
    prisma.job.findMany({
      where,
      include: JOB_INCLUDE,
      orderBy: { [sortBy]: sortOrder },
      skip,
      take: limit,
    }),
    prisma.job.count({ where }),
  ]);

  return { jobs, total, page, limit };
}

const JOB_DETAIL_INCLUDE = {
  customer: { select: { id: true, name: true, company: true } },
  assignments: {
    include: {
      employee: { select: { id: true, firstName: true, lastName: true, photoUrl: true } },
    },
  },
  parentJob: { select: { id: true, title: true, scheduledAt: true } },
  childJobs: {
    where: { deletedAt: null },
    select: { id: true, title: true, scheduledAt: true, status: true },
    orderBy: { scheduledAt: "asc" as const },
  },
  timeEntries: {
    select: { id: true, checkIn: true, checkOut: true, durationMin: true },
    orderBy: { checkIn: "desc" as const },
  },
} as const;

export type JobWithFullDetails = Prisma.JobGetPayload<{ include: typeof JOB_DETAIL_INCLUDE }>;

export async function getJobById(id: string): Promise<JobWithFullDetails | null> {
  return prisma.job.findUnique({
    where: { id, deletedAt: null },
    include: JOB_DETAIL_INCLUDE,
  });
}

function nextOccurrenceDates(base: Date, type: RecurrenceType, count: number): Date[] {
  const dates: Date[] = [];
  let cur = base;
  for (let i = 0; i < count; i++) {
    switch (type) {
      case RecurrenceType.TAEGLICH:          cur = addDays(cur, 1); break;
      case RecurrenceType.WOECHENTLICH:      cur = addWeeks(cur, 1); break;
      case RecurrenceType.ZWEIMAL_MONATLICH: cur = addWeeks(cur, 2); break;
      case RecurrenceType.MONATLICH:         cur = addMonths(cur, 1); break;
      default: break;
    }
    dates.push(new Date(cur));
  }
  return dates;
}

const RECURRENCE_COUNT: Partial<Record<RecurrenceType, number>> = {
  TAEGLICH: 30,
  WOECHENTLICH: 12,
  ZWEIMAL_MONATLICH: 6,
  MONATLICH: 3,
};

export async function createJob(data: JobFormData) {
  const scheduledAt = new Date(data.scheduledAt);

  const job = await prisma.job.create({
    data: {
      title: data.title,
      customerId: data.customerId,
      scheduledAt,
      duration: data.duration,
      recurrence: data.recurrence,
      description: data.description,
      notes: data.notes,
      status: data.status,
      assignments: {
        create: data.employeeIds.map((id) => ({ employeeId: id })),
      },
    },
    include: JOB_INCLUDE,
  });

  // Generate recurring occurrences
  const count = RECURRENCE_COUNT[data.recurrence];
  if (count) {
    const dates = nextOccurrenceDates(scheduledAt, data.recurrence, count);
    await prisma.job.createMany({
      data: dates.map((d) => ({
        title: data.title,
        customerId: data.customerId,
        scheduledAt: d,
        duration: data.duration,
        recurrence: data.recurrence,
        description: data.description,
        notes: data.notes,
        status: "GEPLANT",
        parentJobId: job.id,
      })),
    });
    // Assign employees to child jobs
    if (data.employeeIds.length > 0) {
      const children = await prisma.job.findMany({
        where: { parentJobId: job.id },
        select: { id: true },
      });
      await prisma.jobAssignment.createMany({
        data: children.flatMap((c) =>
          data.employeeIds.map((eid) => ({ jobId: c.id, employeeId: eid }))
        ),
        skipDuplicates: true,
      });
    }
  }

  return job;
}

export async function updateJob(id: string, data: Partial<JobFormData>) {
  const updateData: Prisma.JobUncheckedUpdateInput = {
    title: data.title,
    customerId: data.customerId,
    scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : undefined,
    duration: data.duration,
    recurrence: data.recurrence,
    description: data.description,
    notes: data.notes,
    status: data.status,
  };

  if (data.employeeIds !== undefined) {
    updateData.assignments = {
      deleteMany: {},
      create: data.employeeIds.map((eid) => ({ employeeId: eid })),
    };
  }

  return prisma.job.update({
    where: { id, deletedAt: null },
    data: updateData,
    include: JOB_INCLUDE,
  });
}

export async function updateJobStatus(id: string, status: string) {
  return prisma.job.update({
    where: { id, deletedAt: null },
    data: { status: status as never },
  });
}

export async function softDeleteJob(id: string) {
  return prisma.job.update({
    where: { id, deletedAt: null },
    data: { deletedAt: new Date() },
  });
}

export async function listJobsForCalendar(from: Date, to: Date) {
  return prisma.job.findMany({
    where: {
      deletedAt: null,
      scheduledAt: { gte: from, lte: to },
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
