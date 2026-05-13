import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { checkInSchema, timeEntryListQuerySchema } from "@/types/time-entry.schema";
import { checkIn, listTimeEntries, getActiveEntry, getEmployeeByUserId } from "@/lib/time-entries/queries";
import { apiSuccess, apiError } from "@/types/api";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/db/client";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json(apiError("UNAUTHORIZED", "Nicht angemeldet."), { status: 401 });
  }

  const sp = Object.fromEntries(req.nextUrl.searchParams);
  const parsed = timeEntryListQuerySchema.safeParse(sp);
  if (!parsed.success) {
    return NextResponse.json(apiError("VALIDATION_ERROR", "Ungültige Parameter."), { status: 400 });
  }

  const query = parsed.data;

  // MITARBEITER can only see their own entries
  if (session.user.role !== "ADMIN") {
    const employee = await getEmployeeByUserId(session.user.id);
    if (!employee) {
      return NextResponse.json(apiSuccess({ entries: [], total: 0, page: 1, limit: query.limit }));
    }
    query.employeeId = employee.id;
  }

  const result = await listTimeEntries(query);
  return NextResponse.json(apiSuccess(result));
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json(apiError("UNAUTHORIZED", "Nicht angemeldet."), { status: 401 });
  }

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json(apiError("BAD_REQUEST", "Ungültiger JSON-Body."), { status: 400 });
  }

  const parsed = checkInSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      apiError("VALIDATION_ERROR", "Validierungsfehler.", parsed.error.flatten()),
      { status: 400 }
    );
  }

  // MITARBEITER can only check in for themselves
  if (session.user.role !== "ADMIN") {
    const employee = await getEmployeeByUserId(session.user.id);
    if (!employee || employee.id !== parsed.data.employeeId) {
      return NextResponse.json(apiError("FORBIDDEN", "Keine Berechtigung."), { status: 403 });
    }
  }

  // Prevent double check-in
  const existing = await getActiveEntry(parsed.data.employeeId);
  if (existing) {
    return NextResponse.json(
      apiError("CONFLICT", "Mitarbeiter ist bereits eingecheckt."),
      { status: 409 }
    );
  }

  const entry = await checkIn(parsed.data);

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "timeEntry.checkIn",
      entityType: "TimeEntry",
      entityId: entry.id,
      after: { employeeId: entry.employeeId, checkIn: entry.checkIn },
    },
  });

  logger.info("Check-in recorded", { entryId: entry.id, employeeId: entry.employeeId });
  return NextResponse.json(apiSuccess(entry), { status: 201 });
}
