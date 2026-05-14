import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { employeeApiUpdateBodySchema } from "@/types/employee.schema";
import { getEmployeeById, updateEmployee, softDeleteEmployee } from "@/lib/employees/queries";
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
  const isAdmin = session.user.role === "ADMIN";
  const employee = await getEmployeeById(id, isAdmin);

  if (!employee) {
    return NextResponse.json(apiError("NOT_FOUND", "Mitarbeiter nicht gefunden."), { status: 404 });
  }

  return NextResponse.json(apiSuccess(employee));
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
  const existing = await getEmployeeById(id, true);
  if (!existing) {
    return NextResponse.json(apiError("NOT_FOUND", "Mitarbeiter nicht gefunden."), { status: 404 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(apiError("BAD_REQUEST", "Ungültiger JSON-Body."), { status: 400 });
  }

  const parsed = employeeApiUpdateBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      apiError("VALIDATION_ERROR", "Validierungsfehler.", parsed.error.flatten()),
      { status: 400 }
    );
  }

  const employee = await updateEmployee(id, parsed.data);

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "employee.update",
      entityType: "Employee",
      entityId: id,
      before: { firstName: existing.firstName, lastName: existing.lastName, status: existing.status },
      after: { firstName: parsed.data.firstName, lastName: parsed.data.lastName, status: parsed.data.status },
    },
  });

  logger.info("Employee updated", { employeeId: id, userId: session.user.id });
  return NextResponse.json(apiSuccess(employee));
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
  const existing = await getEmployeeById(id, false);
  if (!existing) {
    return NextResponse.json(apiError("NOT_FOUND", "Mitarbeiter nicht gefunden."), { status: 404 });
  }

  await softDeleteEmployee(id);

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "employee.delete",
      entityType: "Employee",
      entityId: id,
      before: { firstName: existing.firstName, lastName: existing.lastName },
    },
  });

  logger.info("Employee soft-deleted", { employeeId: id, userId: session.user.id });
  return NextResponse.json(apiSuccess({ id }));
}
