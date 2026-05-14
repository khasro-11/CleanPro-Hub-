import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { employeeApiBodySchema, employeeListQuerySchema } from "@/types/employee.schema";
import { createEmployee, listEmployees } from "@/lib/employees/queries";
import { apiSuccess, apiError } from "@/types/api";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/db/client";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json(apiError("UNAUTHORIZED", "Nicht angemeldet."), { status: 401 });
  }

  const raw = Object.fromEntries(req.nextUrl.searchParams.entries());
  const parsed = employeeListQuerySchema.safeParse(raw);

  if (!parsed.success) {
    return NextResponse.json(
      apiError("VALIDATION_ERROR", "Ungültige Abfrageparameter.", parsed.error.flatten()),
      { status: 400 }
    );
  }

  const result = await listEmployees(parsed.data);
  return NextResponse.json(apiSuccess(result));
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json(apiError("UNAUTHORIZED", "Nicht angemeldet."), { status: 401 });
  }
  if (session.user.role !== "ADMIN") {
    return NextResponse.json(apiError("FORBIDDEN", "Keine Berechtigung."), { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(apiError("BAD_REQUEST", "Ungültiger JSON-Body."), { status: 400 });
  }

  const parsed = employeeApiBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      apiError("VALIDATION_ERROR", "Validierungsfehler.", parsed.error.flatten()),
      { status: 400 }
    );
  }

  const employee = await createEmployee(parsed.data);

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "employee.create",
      entityType: "Employee",
      entityId: employee.id,
      after: { firstName: employee.firstName, lastName: employee.lastName },
    },
  });

  logger.info("Employee created", { employeeId: employee.id, userId: session.user.id });
  return NextResponse.json(apiSuccess(employee), { status: 201 });
}
