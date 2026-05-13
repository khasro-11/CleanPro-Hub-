import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { checkOutSchema } from "@/types/time-entry.schema";
import { checkOut, getEmployeeByUserId } from "@/lib/time-entries/queries";
import { apiSuccess, apiError } from "@/types/api";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/db/client";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json(apiError("UNAUTHORIZED", "Nicht angemeldet."), { status: 401 });
  }

  const { id } = await params;

  const existing = await prisma.timeEntry.findUnique({
    where: { id },
    select: { id: true, employeeId: true, checkOut: true },
  });
  if (!existing) {
    return NextResponse.json(apiError("NOT_FOUND", "Zeiteintrag nicht gefunden."), { status: 404 });
  }

  if (existing.checkOut) {
    return NextResponse.json(apiError("CONFLICT", "Bereits ausgecheckt."), { status: 409 });
  }

  // MITARBEITER can only check out their own entry
  if (session.user.role !== "ADMIN") {
    const employee = await getEmployeeByUserId(session.user.id);
    if (!employee || employee.id !== existing.employeeId) {
      return NextResponse.json(apiError("FORBIDDEN", "Keine Berechtigung."), { status: 403 });
    }
  }

  let body: unknown;
  try { body = await req.json(); } catch {
    body = {};
  }

  const parsed = checkOutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      apiError("VALIDATION_ERROR", "Validierungsfehler.", parsed.error.flatten()),
      { status: 400 }
    );
  }

  const entry = await checkOut(id, parsed.data);
  if (!entry) {
    return NextResponse.json(apiError("NOT_FOUND", "Zeiteintrag nicht gefunden."), { status: 404 });
  }

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "timeEntry.checkOut",
      entityType: "TimeEntry",
      entityId: entry.id,
      after: { checkOut: entry.checkOut, durationMin: entry.durationMin },
    },
  });

  logger.info("Check-out recorded", { entryId: entry.id, durationMin: entry.durationMin });
  return NextResponse.json(apiSuccess(entry));
}
