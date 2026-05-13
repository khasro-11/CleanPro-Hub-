import { NextRequest, NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import { join, extname } from "path";
import { auth } from "@/auth";
import { getEmployeeById, updateEmployeePhoto } from "@/lib/employees/queries";
import { apiSuccess, apiError } from "@/types/api";
import { logger } from "@/lib/logger";

type RouteContext = { params: Promise<{ id: string }> };

const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const EXT_MAP: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

export async function POST(req: NextRequest, { params }: RouteContext) {
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

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json(apiError("BAD_REQUEST", "Ungültige Formulardaten."), { status: 400 });
  }

  const file = formData.get("photo");
  if (!(file instanceof File)) {
    return NextResponse.json(apiError("BAD_REQUEST", "Kein Foto übermittelt."), { status: 400 });
  }

  if (!ALLOWED_MIME.includes(file.type)) {
    return NextResponse.json(
      apiError("BAD_REQUEST", "Ungültiges Dateiformat. Erlaubt: JPG, PNG, WebP."),
      { status: 400 }
    );
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      apiError("BAD_REQUEST", "Datei zu groß. Maximal 5 MB erlaubt."),
      { status: 400 }
    );
  }

  const ext = EXT_MAP[file.type] ?? extname(file.name);
  const filename = `${id}${ext}`;
  const uploadDir = join(process.cwd(), "public", "uploads", "employees");
  const filePath = join(uploadDir, filename);

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(filePath, buffer);

  const photoUrl = `/uploads/employees/${filename}`;
  await updateEmployeePhoto(id, photoUrl);

  logger.info("Employee photo updated", { employeeId: id, userId: session.user.id });
  return NextResponse.json(apiSuccess({ photoUrl }));
}
