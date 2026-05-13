import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { exportQuerySchema } from "@/types/time-entry.schema";
import { listTimeEntriesForExport } from "@/lib/time-entries/queries";
import { apiError } from "@/types/api";
import { format } from "date-fns";

function escapeCsvField(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function toCsvRow(fields: string[]): string {
  return fields.map(escapeCsvField).join(",");
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json(apiError("UNAUTHORIZED", "Nicht angemeldet."), { status: 401 });
  }
  if (session.user.role !== "ADMIN") {
    return NextResponse.json(apiError("FORBIDDEN", "Keine Berechtigung."), { status: 403 });
  }

  const sp = Object.fromEntries(req.nextUrl.searchParams);
  const parsed = exportQuerySchema.safeParse(sp);
  if (!parsed.success) {
    return NextResponse.json(apiError("VALIDATION_ERROR", "Ungültige Parameter."), { status: 400 });
  }

  const { employeeId, from, to } = parsed.data;
  const entries = await listTimeEntriesForExport(employeeId, from, to);

  const header = toCsvRow(["Name", "Datum", "Eingestempelt", "Ausgestempelt", "Dauer (Min.)", "Auftrag", "Notizen"]);
  const rows = entries.map((e) =>
    toCsvRow([
      `${e.employee.lastName}, ${e.employee.firstName}`,
      format(new Date(e.checkIn), "dd.MM.yyyy"),
      format(new Date(e.checkIn), "HH:mm"),
      e.checkOut ? format(new Date(e.checkOut), "HH:mm") : "",
      e.durationMin != null ? String(e.durationMin) : "",
      e.job?.title ?? "",
      e.notes ?? "",
    ])
  );

  const csv = [header, ...rows].join("\r\n");
  const filename = `zeiterfassung_${format(new Date(), "yyyy-MM-dd")}.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
