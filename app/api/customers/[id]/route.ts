import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { customerApiUpdateBodySchema } from "@/types/customer.schema";
import { getCustomerById, updateCustomer, softDeleteCustomer } from "@/lib/customers/queries";
import { apiSuccess, apiError } from "@/types/api";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/db/client";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json(apiError("UNAUTHORIZED", "Nicht angemeldet."), { status: 401 });
  }

  const { id } = await params;
  const customer = await getCustomerById(id);
  if (!customer) {
    return NextResponse.json(apiError("NOT_FOUND", "Kunde nicht gefunden."), { status: 404 });
  }

  return NextResponse.json(apiSuccess(customer));
}

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json(apiError("UNAUTHORIZED", "Nicht angemeldet."), { status: 401 });
  }
  if (session.user.role !== "ADMIN") {
    return NextResponse.json(apiError("FORBIDDEN", "Keine Berechtigung."), { status: 403 });
  }

  const { id } = await params;
  const existing = await getCustomerById(id);
  if (!existing) {
    return NextResponse.json(apiError("NOT_FOUND", "Kunde nicht gefunden."), { status: 404 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(apiError("BAD_REQUEST", "Ungültiger JSON-Body."), { status: 400 });
  }

  const parsed = customerApiUpdateBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      apiError("VALIDATION_ERROR", "Validierungsfehler.", parsed.error.flatten()),
      { status: 400 }
    );
  }

  const customer = await updateCustomer(id, parsed.data);

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "customer.update",
      entityType: "Customer",
      entityId: id,
      before: { name: existing.name, status: existing.status },
      after: parsed.data,
    },
  });

  logger.info("Customer updated", { customerId: id, userId: session.user.id });
  return NextResponse.json(apiSuccess(customer));
}

export async function DELETE(_req: NextRequest, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json(apiError("UNAUTHORIZED", "Nicht angemeldet."), { status: 401 });
  }
  if (session.user.role !== "ADMIN") {
    return NextResponse.json(apiError("FORBIDDEN", "Keine Berechtigung."), { status: 403 });
  }

  const { id } = await params;
  const existing = await getCustomerById(id);
  if (!existing) {
    return NextResponse.json(apiError("NOT_FOUND", "Kunde nicht gefunden."), { status: 404 });
  }

  await softDeleteCustomer(id);

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "customer.delete",
      entityType: "Customer",
      entityId: id,
      before: { name: existing.name },
    },
  });

  logger.info("Customer soft-deleted", { customerId: id, userId: session.user.id });
  return NextResponse.json(apiSuccess({ id }));
}
