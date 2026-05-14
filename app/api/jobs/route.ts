import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { jobFormSchema, jobListQuerySchema } from "@/types/job.schema";
import { createJob, listJobs } from "@/lib/jobs/queries";
import { apiSuccess, apiError } from "@/types/api";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/db/client";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json(apiError("UNAUTHORIZED", "Nicht angemeldet."), { status: 401 });
  }

  const raw = Object.fromEntries(req.nextUrl.searchParams.entries());
  const parsed = jobListQuerySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      apiError("VALIDATION_ERROR", "Ungültige Abfrageparameter.", parsed.error.flatten()),
      { status: 400 }
    );
  }

  // MITARBEITER can only see their own jobs
  if (session.user.role === "MITARBEITER") {
    const emp = await prisma.employee.findFirst({
      where: { userId: session.user.id, deletedAt: null },
      select: { id: true },
    });
    if (emp) {
      parsed.data.employeeId = emp.id;
      parsed.data.employees = undefined;
    }
  }

  const result = await listJobs(parsed.data);
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

  const parsed = jobFormSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      apiError("VALIDATION_ERROR", "Validierungsfehler.", parsed.error.flatten()),
      { status: 400 }
    );
  }

  const job = await createJob(parsed.data);

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "job.create",
      entityType: "Job",
      entityId: job.id,
      after: { title: job.title, customerId: job.customerId, recurrence: job.recurrence },
    },
  });

  logger.info("Job created", { jobId: job.id, userId: session.user.id });
  return NextResponse.json(apiSuccess(job), { status: 201 });
}
