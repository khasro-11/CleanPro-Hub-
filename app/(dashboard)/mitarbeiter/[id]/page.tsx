import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import {
  ChevronLeft, Pencil, Phone, Mail, MapPin, ClipboardList, Shield,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { getEmployeeById, getEmployeeHoursSummary } from "@/lib/employees/queries";
import { requireAuth } from "@/lib/auth/session";
import { formatDate, formatDateTime, formatCurrency, formatInitials } from "@/lib/utils/format";
import {
  EMPLOYEE_STATUS_LABELS, EMPLOYEE_CONTRACT_TYPE_LABELS, JOB_STATUS_LABELS,
} from "@/lib/utils/labels";
import { DeleteEmployeeButton } from "@/components/forms/DeleteEmployeeButton";
import { PhotoUpload } from "@/components/forms/PhotoUpload";
import { EmployeeStatus, JobStatus } from "@prisma/client";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const session = await requireAuth();
  const emp = await getEmployeeById(id, session.user.role === "ADMIN");
  return { title: emp ? `${emp.firstName} ${emp.lastName}` : "Mitarbeiter" };
}

const STATUS_COLORS: Record<EmployeeStatus, string> = {
  AKTIV: "bg-emerald-500",
  KRANK: "bg-amber-500",
  URLAUB: "bg-brand-500",
  INAKTIV: "bg-muted-foreground",
};

const JOB_VARIANTS: Record<JobStatus, "default" | "secondary" | "outline" | "destructive"> = {
  GEPLANT: "secondary",
  IN_BEARBEITUNG: "default",
  ABGESCHLOSSEN: "outline",
  ABGESAGT: "destructive",
};

export default async function MitarbeiterDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireAuth();
  const { id } = await params;
  const isAdmin = session.user.role === "ADMIN";

  const [employee, hours] = await Promise.all([
    getEmployeeById(id, isAdmin),
    getEmployeeHoursSummary(id),
  ]);
  if (!employee) notFound();

  const fullName = `${employee.firstName} ${employee.lastName}`;
  const initials = formatInitials(employee.firstName, employee.lastName);
  const emp = employee as typeof employee & { taxId?: string; svNumber?: string };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm" className="text-muted-foreground">
          <Link href="/mitarbeiter"><ChevronLeft className="mr-1 h-4 w-4" />Mitarbeiter</Link>
        </Button>
      </div>

      {/* Header */}
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-5">
          <div className="relative h-20 w-20 shrink-0 rounded-full overflow-hidden border-2 border-border bg-muted">
            {employee.photoUrl ? (
              <Image src={employee.photoUrl} alt={fullName} fill className="object-cover" sizes="80px" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-brand-500/10">
                <span className="text-xl font-bold text-brand-600">{initials}</span>
              </div>
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{fullName}</h1>
            {employee.email && <p className="text-sm text-muted-foreground">{employee.email}</p>}
            <div className="mt-2 flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${STATUS_COLORS[employee.status]}`} />
              <Badge>{EMPLOYEE_STATUS_LABELS[employee.status]}</Badge>
              <Badge variant="secondary">{EMPLOYEE_CONTRACT_TYPE_LABELS[employee.contractType]}</Badge>
            </div>
          </div>
        </div>
        {isAdmin && (
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link href={`/mitarbeiter/${id}/bearbeiten`}>
                <Pencil className="mr-2 h-4 w-4" />Bearbeiten
              </Link>
            </Button>
            <DeleteEmployeeButton employeeId={id} employeeName={fullName} />
          </div>
        )}
      </div>

      {/* Hours summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Diese Woche", value: `${hours.week} Std.` },
          { label: "Diesen Monat", value: `${hours.month} Std.` },
          { label: "Gesamt", value: `${hours.total} Std.` },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-xl border border-border/60 bg-card p-4 shadow-elevated text-center">
            <p className="text-xl font-bold text-brand-500">{value}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>

      {/* Details grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Contact */}
        <div className="rounded-xl border border-border/60 bg-card p-5 shadow-elevated space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Kontakt</h2>
          <div className="space-y-3">
            {employee.phone && (
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 shrink-0 text-muted-foreground" />
                <a href={`tel:${employee.phone}`} className="text-sm hover:text-brand-500">{employee.phone}</a>
              </div>
            )}
            {employee.email && (
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 shrink-0 text-muted-foreground" />
                <a href={`mailto:${employee.email}`} className="text-sm hover:text-brand-500">{employee.email}</a>
              </div>
            )}
            {employee.street && (
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="text-sm"><p>{employee.street}</p><p>{employee.zip} {employee.city}</p></div>
              </div>
            )}
          </div>
        </div>

        {/* Employment */}
        <div className="rounded-xl border border-border/60 bg-card p-5 shadow-elevated space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Beschäftigung</h2>
          <dl className="space-y-2.5">
            <Row label="Vertragsart" value={EMPLOYEE_CONTRACT_TYPE_LABELS[employee.contractType]} />
            {employee.weeklyHours && <Row label="Wochenstunden" value={`${employee.weeklyHours} Std.`} />}
            {employee.hourlyWage && <Row label="Stundenlohn" value={formatCurrency(Number(employee.hourlyWage))} />}
            {employee.birthDate && <Row label="Geburtsdatum" value={formatDate(employee.birthDate)} />}
            {employee.startDate && <Row label="Eingetreten" value={formatDate(employee.startDate)} />}
            <Row label="Eingetragen" value={formatDate(employee.createdAt)} />
          </dl>
        </div>
      </div>

      {/* Sensitive data — Admin only */}
      {isAdmin && (emp.taxId || emp.svNumber) && (
        <div className="rounded-xl border border-amber-200/60 bg-amber-50/50 p-5 dark:border-amber-800/30 dark:bg-amber-900/10">
          <div className="mb-3 flex items-center gap-2">
            <Shield className="h-4 w-4 text-amber-600" />
            <h2 className="text-sm font-semibold text-amber-700 dark:text-amber-400">Vertrauliche Daten</h2>
          </div>
          <dl className="space-y-2.5">
            {emp.taxId && <Row label="Steuer-ID" value={emp.taxId} />}
            {emp.svNumber && <Row label="Sozialversicherungsnr." value={emp.svNumber} />}
          </dl>
        </div>
      )}

      {/* Photo upload — Admin only */}
      {isAdmin && (
        <div className="rounded-xl border border-border/60 bg-card p-5 shadow-elevated">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Foto</h2>
          <PhotoUpload
            employeeId={id}
            currentPhotoUrl={employee.photoUrl}
            initials={initials}
          />
        </div>
      )}

      {/* Jobs */}
      {"jobAssignments" in employee && Array.isArray(employee.jobAssignments) && (
        <div className="rounded-xl border border-border/60 bg-card shadow-elevated">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border/60">
            <div className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold">Aktuelle Aufträge</h2>
            </div>
            <Badge variant="secondary">{employee.jobAssignments.length}</Badge>
          </div>
          {employee.jobAssignments.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-muted-foreground">Keine Aufträge zugewiesen.</div>
          ) : (
            <ul className="divide-y divide-border/60">
              {(employee.jobAssignments as Array<{ job: { id: string; title: string; status: JobStatus; scheduledAt: Date; customer: { name: string } } }>).map(({ job }) => (
                <li key={job.id} className="flex items-center justify-between px-5 py-3.5">
                  <div>
                    <p className="text-sm font-medium">{job.title}</p>
                    <p className="text-xs text-muted-foreground">{job.customer.name} · {formatDateTime(job.scheduledAt)}</p>
                  </div>
                  <Badge variant={JOB_VARIANTS[job.status]}>{JOB_STATUS_LABELS[job.status]}</Badge>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <Separator />
      <p className="text-xs text-muted-foreground">Mitarbeiter-ID: {employee.id}</p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium text-right">{value}</dd>
    </div>
  );
}
