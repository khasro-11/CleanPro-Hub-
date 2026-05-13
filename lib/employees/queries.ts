import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/client";
import { encrypt, decrypt } from "@/lib/crypto";
import type { EmployeeFormData, EmployeeListQuery } from "@/types/employee.schema";

export type EmployeeSafe = Prisma.EmployeeGetPayload<{
  select: {
    id: true; firstName: true; lastName: true; photoUrl: true;
    email: true; phone: true; street: true; zip: true; city: true;
    birthDate: true; startDate: true; hourlyWage: true;
    contractType: true; status: true; weeklyHours: true;
    createdAt: true; updatedAt: true; deletedAt: true; userId: true;
    _count: { select: { jobAssignments: true; timeEntries: true } };
  };
}>;

export type EmployeeAdmin = EmployeeSafe & { taxId?: string; svNumber?: string };

export type EmployeeWithDetails = Prisma.EmployeeGetPayload<{
  include: {
    jobAssignments: {
      include: {
        job: {
          select: { id: true; title: true; status: true; scheduledAt: true; customer: { select: { name: true } } };
        };
      };
      take: 5;
      orderBy: { job: { scheduledAt: "desc" } };
    };
    timeEntries: {
      select: { id: true; checkIn: true; checkOut: true; durationMin: true };
      take: 5;
      orderBy: { checkIn: "desc" };
    };
  };
}>;

const SAFE_SELECT = {
  id: true, firstName: true, lastName: true, photoUrl: true,
  email: true, phone: true, street: true, zip: true, city: true,
  birthDate: true, startDate: true, hourlyWage: true,
  contractType: true, status: true, weeklyHours: true,
  createdAt: true, updatedAt: true, deletedAt: true, userId: true,
  _count: { select: { jobAssignments: true, timeEntries: true } },
} as const;

export async function listEmployees(query: EmployeeListQuery) {
  const { page, limit, search, status, contractType, sortBy, sortOrder } = query;
  const skip = (page - 1) * limit;

  const where: Prisma.EmployeeWhereInput = {
    deletedAt: null,
    ...(status && { status }),
    ...(contractType && { contractType }),
    ...(search && {
      OR: [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { city: { contains: search, mode: "insensitive" } },
      ],
    }),
  };

  const [employees, total] = await prisma.$transaction([
    prisma.employee.findMany({
      where,
      select: SAFE_SELECT,
      orderBy: { [sortBy]: sortOrder },
      skip,
      take: limit,
    }),
    prisma.employee.count({ where }),
  ]);

  return { employees, total, page, limit };
}

export async function getEmployeeById(id: string, isAdmin: boolean): Promise<EmployeeAdmin | null> {
  const employee = await prisma.employee.findUnique({
    where: { id, deletedAt: null },
    include: {
      jobAssignments: {
        include: {
          job: {
            select: {
              id: true, title: true, status: true, scheduledAt: true,
              customer: { select: { name: true } },
            },
          },
        },
        take: 5,
        orderBy: { job: { scheduledAt: "desc" } },
      },
      timeEntries: {
        select: { id: true, checkIn: true, checkOut: true, durationMin: true },
        take: 5,
        orderBy: { checkIn: "desc" },
      },
    },
  });

  if (!employee) return null;

  const { taxIdEncrypted, svNumberEncrypted, ...safe } = employee;

  if (!isAdmin) return safe as unknown as EmployeeAdmin;

  return {
    ...safe,
    taxId: taxIdEncrypted ? decrypt(taxIdEncrypted) : undefined,
    svNumber: svNumberEncrypted ? decrypt(svNumberEncrypted) : undefined,
  } as unknown as EmployeeAdmin;
}

function parseDateString(value: string | undefined): Date | undefined {
  if (!value) return undefined;
  const d = new Date(value);
  return isNaN(d.getTime()) ? undefined : d;
}

export async function createEmployee(data: EmployeeFormData) {
  return prisma.employee.create({
    data: {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email || undefined,
      phone: data.phone,
      street: data.street,
      zip: data.zip || undefined,
      city: data.city,
      birthDate: parseDateString(data.birthDate),
      startDate: parseDateString(data.startDate),
      hourlyWage: data.hourlyWage ?? undefined,
      contractType: data.contractType,
      status: data.status,
      weeklyHours: data.weeklyHours || undefined,
      taxIdEncrypted: data.taxId ? encrypt(data.taxId) : undefined,
      svNumberEncrypted: data.svNumber ? encrypt(data.svNumber) : undefined,
    },
  });
}

export async function updateEmployee(id: string, data: Partial<EmployeeFormData>) {
  const updateData: Prisma.EmployeeUpdateInput = {
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email || undefined,
    phone: data.phone,
    street: data.street,
    zip: data.zip || undefined,
    city: data.city,
    birthDate: parseDateString(data.birthDate),
    startDate: parseDateString(data.startDate),
    hourlyWage: data.hourlyWage ?? undefined,
    contractType: data.contractType,
    status: data.status,
    weeklyHours: data.weeklyHours || undefined,
  };

  if (data.taxId !== undefined) {
    updateData.taxIdEncrypted = data.taxId ? encrypt(data.taxId) : null;
  }
  if (data.svNumber !== undefined) {
    updateData.svNumberEncrypted = data.svNumber ? encrypt(data.svNumber) : null;
  }

  return prisma.employee.update({
    where: { id, deletedAt: null },
    data: updateData,
  });
}

export async function updateEmployeePhoto(id: string, photoUrl: string) {
  return prisma.employee.update({
    where: { id, deletedAt: null },
    data: { photoUrl },
  });
}

export async function softDeleteEmployee(id: string) {
  return prisma.employee.update({
    where: { id, deletedAt: null },
    data: { deletedAt: new Date() },
  });
}

export async function getEmployeeHoursSummary(id: string) {
  const entries = await prisma.timeEntry.findMany({
    where: { employeeId: id, checkOut: { not: null } },
    select: { durationMin: true, checkIn: true },
  });

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());

  let totalMin = 0, monthMin = 0, weekMin = 0;
  for (const e of entries) {
    const min = e.durationMin ?? 0;
    totalMin += min;
    if (e.checkIn >= startOfMonth) monthMin += min;
    if (e.checkIn >= startOfWeek) weekMin += min;
  }

  return {
    total: Math.round(totalMin / 60 * 10) / 10,
    month: Math.round(monthMin / 60 * 10) / 10,
    week: Math.round(weekMin / 60 * 10) / 10,
  };
}
