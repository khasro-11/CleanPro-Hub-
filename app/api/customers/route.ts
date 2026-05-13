import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { customerFormSchema, customerListQuerySchema } from "@/types/customer.schema";
import { createCustomer, listCustomers } from "@/lib/customers/queries";
import { apiSuccess, apiError } from "@/types/api";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/db/client";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json(apiError("UNAUTHORIZED", "Nicht angemeldet."), { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const raw = Object.fromEntries(searchParams.entries());
  const parsed = customerListQuerySchema.safeParse(raw);

  if (!parsed.success) {
    return NextResponse.json(
      apiError("VALIDATION_ERROR", "Ungültige Abfrageparameter.", parsed.error.flatten()),
      { status: 400 }
    );
  }

  const result = await listCustomers(parsed.data);
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

  const parsed = customerFormSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      apiError("VALIDATION_ERROR", "Validierungsfehler.", parsed.error.flatten()),
      { status: 400 }
    );
  }

  const customer = await createCustomer(parsed.data);

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "customer.create",
      entityType: "Customer",
      entityId: customer.id,
      after: { name: customer.name },
    },
  });

  logger.info("Customer created", { customerId: customer.id, userId: session.user.id });
  return NextResponse.json(apiSuccess(customer), { status: 201 });
}
