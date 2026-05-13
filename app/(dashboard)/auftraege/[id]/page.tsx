import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ChevronLeft, Pencil, Clock, CalendarClock, Users, AlignLeft,
  StickyNote, RefreshCw, Building2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getJobById } from "@/lib/jobs/queries";
import { requireAuth } from "@/lib/auth/session";
import { formatDateTime, formatDuration, formatInitials } from "@/lib/utils/format";
import {
  JOB_STATUS_LABELS, JOB_STATUS_COLORS, RECURRENCE_TYPE_LABELS,
} from "@/lib/utils/labels";
import { DeleteJobButton } from "@/components/forms/DeleteJobButton";
import { JobStatusButton } from "@/components/forms/JobStatusButton";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const job = await getJobById(id);
  return { title: job?.title ?? "Auftrag" };
}

export default async function AuftragDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireAuth();
  const { id } = await params;
  const job = await getJobById(id);
  if (!job) notFound();

  const isAdmin = session.user.role === "ADMIN";

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Breadcrumb */}
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm" className="text-muted-foreground">
          <Link href="/auftraege">
            <ChevronLeft className="mr-1 h-4 w-4" />
            Aufträge
          </Link>
        </Button>
      </div>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">{job.title}</h1>
            <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${JOB_STATUS_COLORS[job.status]}`}>
              {JOB_STATUS_LABELS[job.status]}
            </span>
          </div>
          <p className="mt-1 text-muted-foreground">
            {job.customer.name}
            {job.customer.company ? ` – ${job.customer.company}` : ""}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <JobStatusButton jobId={id} currentStatus={job.status} />
          {isAdmin && (
            <>
              <Button asChild variant="outline">
                <Link href={`/auftraege/${id}/bearbeiten`}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Bearbeiten
                </Link>
              </Button>
              <DeleteJobButton jobId={id} jobTitle={job.title} />
            </>
          )}
        </div>
      </div>

      {/* Details grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Scheduling card */}
        <div className="rounded-xl border border-border/60 bg-card p-5 shadow-elevated space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Termin</h2>
          <dl className="space-y-3">
            <DetailRow
              icon={<CalendarClock className="h-4 w-4 text-muted-foreground" />}
              label="Datum & Uhrzeit"
              value={formatDateTime(job.scheduledAt)}
            />
            <DetailRow
              icon={<Clock className="h-4 w-4 text-muted-foreground" />}
              label="Dauer"
              value={formatDuration(job.duration)}
            />
            <DetailRow
              icon={<RefreshCw className="h-4 w-4 text-muted-foreground" />}
              label="Wiederholung"
              value={RECURRENCE_TYPE_LABELS[job.recurrence]}
            />
            <DetailRow
              icon={<Building2 className="h-4 w-4 text-muted-foreground" />}
              label="Kunde"
              value={
                <Link href={`/kunden/${job.customer.id}`} className="hover:text-brand-500 underline underline-offset-2">
                  {job.customer.name}
                </Link>
              }
            />
          </dl>
        </div>

        {/* Employees card */}
        <div className="rounded-xl border border-border/60 bg-card p-5 shadow-elevated space-y-4">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Mitarbeiter</h2>
            <Badge variant="secondary" className="ml-auto">{job.assignments.length}</Badge>
          </div>
          {job.assignments.length === 0 ? (
            <p className="text-sm text-muted-foreground">Noch keine Mitarbeiter zugewiesen.</p>
          ) : (
            <ul className="space-y-2.5">
              {job.assignments.map(({ employee }) => (
                <li key={employee.id} className="flex items-center gap-3">
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarFallback className="bg-brand-500/10 text-brand-600 text-xs font-semibold">
                      {formatInitials(employee.firstName, employee.lastName)}
                    </AvatarFallback>
                  </Avatar>
                  <Link
                    href={`/mitarbeiter/${employee.id}`}
                    className="text-sm font-medium hover:text-brand-500"
                  >
                    {employee.firstName} {employee.lastName}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Description / Notes */}
      {(job.description || job.notes) && (
        <div className="grid gap-4 md:grid-cols-2">
          {job.description && (
            <div className="rounded-xl border border-border/60 bg-card p-5 shadow-elevated">
              <div className="mb-3 flex items-center gap-2">
                <AlignLeft className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Beschreibung</h2>
              </div>
              <p className="text-sm whitespace-pre-wrap">{job.description}</p>
            </div>
          )}
          {job.notes && (
            <div className="rounded-xl border border-border/60 bg-card p-5 shadow-elevated">
              <div className="mb-3 flex items-center gap-2">
                <StickyNote className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Interne Notizen</h2>
              </div>
              <p className="text-sm whitespace-pre-wrap">{job.notes}</p>
            </div>
          )}
        </div>
      )}

      {/* Recurring child jobs */}
      {job.childJobs.length > 0 && (
        <div className="rounded-xl border border-border/60 bg-card shadow-elevated">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border/60">
            <h2 className="text-sm font-semibold">Folgeaufträge</h2>
            <Badge variant="secondary">{job.childJobs.length}</Badge>
          </div>
          <ul className="divide-y divide-border/60">
            {job.childJobs.map((child) => (
              <li key={child.id} className="flex items-center justify-between px-5 py-3 hover:bg-muted/20">
                <div>
                  <p className="text-sm font-medium">{child.title}</p>
                  <p className="text-xs text-muted-foreground">{formatDateTime(child.scheduledAt)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${JOB_STATUS_COLORS[child.status]}`}>
                    {JOB_STATUS_LABELS[child.status]}
                  </span>
                  <Button asChild variant="ghost" size="sm">
                    <Link href={`/auftraege/${child.id}`}>Ansehen</Link>
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Parent job link */}
      {job.parentJob && (
        <div className="rounded-xl border border-border/60 bg-card p-4 shadow-elevated flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold mb-0.5">Übergeordneter Auftrag</p>
            <p className="text-sm font-medium">
              {job.parentJob.title} — {formatDateTime(job.parentJob.scheduledAt)}
            </p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href={`/auftraege/${job.parentJob.id}`}>
              <ChevronLeft className="mr-1 h-4 w-4" />
              Zur Serie
            </Link>
          </Button>
        </div>
      )}

      <Separator />
      <p className="text-xs text-muted-foreground">Auftrags-ID: {job.id}</p>
    </div>
  );
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: ReactNode;
}): ReactNode {
  return (
    <div className="flex items-center gap-3">
      <span className="shrink-0">{icon}</span>
      <dt className="text-sm text-muted-foreground w-32 shrink-0">{label}</dt>
      <dd className="text-sm font-medium">{value}</dd>
    </div>
  );
}
