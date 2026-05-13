import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { jobStatusSchema } from "@/types/job.schema";
import { getJobById, updateJobStatus } from "@/lib/jobs/queries";
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
  const existing = await getJobById(id);
  if (!existing) {
    return NextResponse.json(apiError("NOT_FOUND", "Auftrag nicht gefunden."), { status: 404 });
  }

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json(apiError("BAD_REQUEST", "Ungültiger JSON-Body."), { status: 400 });
  }

  const parsed = jobStatusSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      apiError("VALIDATION_ERROR", "Ungültiger Status.", parsed.error.flatten()),
      { status: 400 }
    );
  }

  const job = await updateJobStatus(id, parsed.data.status);

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "job.status",
      entityType: "Job",
      entityId: id,
      before: { status: existing.status },
      after: { status: parsed.data.status },
    },
  });

  logger.info("Job status updated", { jobId: id, status: parsed.data.status, userId: session.user.id });
  return NextResponse.json(apiSuccess(job));
}
