import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { jobUpdateSchema } from "@/types/job.schema";
import { getJobById, updateJob, softDeleteJob } from "@/lib/jobs/queries";
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
  const job = await getJobById(id);
  if (!job) {
    return NextResponse.json(apiError("NOT_FOUND", "Auftrag nicht gefunden."), { status: 404 });
  }
  return NextResponse.json(apiSuccess(job));
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
  const existing = await getJobById(id);
  if (!existing) {
    return NextResponse.json(apiError("NOT_FOUND", "Auftrag nicht gefunden."), { status: 404 });
  }

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json(apiError("BAD_REQUEST", "Ungültiger JSON-Body."), { status: 400 });
  }

  const parsed = jobUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      apiError("VALIDATION_ERROR", "Validierungsfehler.", parsed.error.flatten()),
      { status: 400 }
    );
  }

  const job = await updateJob(id, parsed.data);

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "job.update",
      entityType: "Job",
      entityId: id,
      before: { title: existing.title, status: existing.status },
      after: { title: parsed.data.title, status: parsed.data.status },
    },
  });

  logger.info("Job updated", { jobId: id, userId: session.user.id });
  return NextResponse.json(apiSuccess(job));
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
  const existing = await getJobById(id);
  if (!existing) {
    return NextResponse.json(apiError("NOT_FOUND", "Auftrag nicht gefunden."), { status: 404 });
  }

  await softDeleteJob(id);

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "job.delete",
      entityType: "Job",
      entityId: id,
      before: { title: existing.title },
    },
  });

  logger.info("Job soft-deleted", { jobId: id, userId: session.user.id });
  return NextResponse.json(apiSuccess({ id }));
}
