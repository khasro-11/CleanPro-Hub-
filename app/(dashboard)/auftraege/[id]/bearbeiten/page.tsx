import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { JobForm } from "@/components/forms/JobForm";
import { getJobById } from "@/lib/jobs/queries";
import { requireAdmin } from "@/lib/auth/session";
import type { JobFormInput } from "@/types/job.schema";
import { format } from "date-fns";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const job = await getJobById(id);
  return { title: job ? `${job.title} bearbeiten` : "Bearbeiten" };
}

export default async function AuftragBearbeitenPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const job = await getJobById(id);
  if (!job) notFound();

  const defaultValues: Partial<JobFormInput> = {
    title: job.title,
    customerId: job.customerId,
    scheduledAt: format(new Date(job.scheduledAt), "yyyy-MM-dd'T'HH:mm"),
    duration: job.duration,
    recurrence: job.recurrence,
    employeeIds: job.assignments.map((a) => a.employee.id),
    description: job.description ?? "",
    notes: job.notes ?? "",
    status: job.status,
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm" className="text-muted-foreground">
          <Link href={`/auftraege/${id}`}>
            <ChevronLeft className="mr-1 h-4 w-4" />
            {job.title}
          </Link>
        </Button>
      </div>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">Auftrag bearbeiten</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Aktualisieren Sie die Daten für <strong>{job.title}</strong>.
        </p>
      </div>

      <div className="rounded-xl border border-border/60 bg-card p-6 shadow-elevated">
        <JobForm mode="edit" jobId={id} defaultValues={defaultValues} />
      </div>
    </div>
  );
}
