import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getEmployeeHoursSummaryForEntry, getEmployeeByUserId } from "@/lib/time-entries/queries";
import { apiSuccess, apiError } from "@/types/api";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json(apiError("UNAUTHORIZED", "Nicht angemeldet."), { status: 401 });
  }

  const employeeId = req.nextUrl.searchParams.get("employeeId") ?? "";

  // MITARBEITER can only query their own summary
  if (session.user.role !== "ADMIN") {
    const own = await getEmployeeByUserId(session.user.id);
    if (!own || own.id !== employeeId) {
      return NextResponse.json(apiError("FORBIDDEN", "Keine Berechtigung."), { status: 403 });
    }
  }

  if (!employeeId) {
    return NextResponse.json(apiError("BAD_REQUEST", "employeeId fehlt."), { status: 400 });
  }

  const summary = await getEmployeeHoursSummaryForEntry(employeeId);
  return NextResponse.json(apiSuccess(summary));
}
