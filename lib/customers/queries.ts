import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/client";
import type { CustomerListQuery, CustomerFormData } from "@/types/customer.schema";

export type CustomerWithJobCount = Prisma.CustomerGetPayload<{
  include: { _count: { select: { jobs: true } } };
}>;

export type CustomerWithJobs = Prisma.CustomerGetPayload<{
  include: {
    jobs: {
      where: { deletedAt: null };
      orderBy: { scheduledAt: "desc" };
      take: 10;
      select: { id: true; title: true; status: true; scheduledAt: true; duration: true };
    };
  };
}>;

export async function listCustomers(query: CustomerListQuery) {
  const { page, limit, search, status, customerType, sortBy, sortOrder } = query;
  const skip = (page - 1) * limit;

  const where: Prisma.CustomerWhereInput = {
    deletedAt: null,
    ...(status && { status }),
    ...(customerType && { customerType }),
    ...(search && {
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { company: { contains: search, mode: "insensitive" } },
        { city: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ],
    }),
  };

  const [customers, total] = await prisma.$transaction([
    prisma.customer.findMany({
      where,
      include: { _count: { select: { jobs: true } } },
      orderBy: { [sortBy]: sortOrder },
      skip,
      take: limit,
    }),
    prisma.customer.count({ where }),
  ]);

  return { customers, total, page, limit };
}

export async function getCustomerById(id: string): Promise<CustomerWithJobs | null> {
  return prisma.customer.findUnique({
    where: { id, deletedAt: null },
    include: {
      jobs: {
        where: { deletedAt: null },
        orderBy: { scheduledAt: "desc" },
        take: 10,
        select: { id: true, title: true, status: true, scheduledAt: true, duration: true },
      },
    },
  });
}

export async function createCustomer(data: CustomerFormData) {
  return prisma.customer.create({
    data: {
      name: data.name,
      company: data.company,
      street: data.street,
      zip: data.zip,
      city: data.city,
      phone: data.phone,
      email: data.email || undefined,
      customerType: data.customerType,
      contractType: data.contractType,
      hourlyRate: data.hourlyRate ?? undefined,
      flatRate: data.flatRate ?? undefined,
      notes: data.notes,
      status: data.status,
    },
  });
}

export async function updateCustomer(id: string, data: Partial<CustomerFormData>) {
  return prisma.customer.update({
    where: { id, deletedAt: null },
    data: {
      ...data,
      email: data.email || undefined,
      hourlyRate: data.hourlyRate ?? undefined,
      flatRate: data.flatRate ?? undefined,
    },
  });
}

export async function softDeleteCustomer(id: string) {
  return prisma.customer.update({
    where: { id, deletedAt: null },
    data: { deletedAt: new Date() },
  });
}
