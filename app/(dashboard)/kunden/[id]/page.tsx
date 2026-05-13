import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Pencil, Phone, Mail, MapPin, ClipboardList } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { getCustomerById } from "@/lib/customers/queries";
import { requireAuth } from "@/lib/auth/session";
import { formatDate, formatDateTime, formatCurrency } from "@/lib/utils/format";
import {
  CUSTOMER_TYPE_LABELS, CONTRACT_TYPE_LABELS,
  CUSTOMER_STATUS_LABELS, JOB_STATUS_LABELS,
} from "@/lib/utils/labels";
import { DeleteCustomerButton } from "@/components/forms/DeleteCustomerButton";
import { CustomerStatus, JobStatus } from "@prisma/client";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const customer = await getCustomerById(id);
  return { title: customer?.name ?? "Kunde" };
}

const STATUS_VARIANTS: Record<CustomerStatus, "default" | "secondary" | "outline"> = {
  AKTIV: "default",
  INAKTIV: "secondary",
  ARCHIVIERT: "outline",
};

const JOB_STATUS_VARIANTS: Record<JobStatus, "default" | "secondary" | "outline" | "destructive"> = {
  GEPLANT: "secondary",
  IN_BEARBEITUNG: "default",
  ABGESCHLOSSEN: "outline",
  ABGESAGT: "destructive",
};

export default async function KundeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireAuth();
  const { id } = await params;
  const customer = await getCustomerById(id);
  if (!customer) notFound();

  const isAdmin = session.user.role === "ADMIN";

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Breadcrumb */}
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm" className="text-muted-foreground">
          <Link href="/kunden">
            <ChevronLeft className="mr-1 h-4 w-4" />
            Kunden
          </Link>
        </Button>
      </div>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">{customer.name}</h1>
            <Badge variant={STATUS_VARIANTS[customer.status]}>
              {CUSTOMER_STATUS_LABELS[customer.status]}
            </Badge>
          </div>
          {customer.company && (
            <p className="mt-1 text-muted-foreground">{customer.company}</p>
          )}
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link href={`/kunden/${id}/bearbeiten`}>
                <Pencil className="mr-2 h-4 w-4" />
                Bearbeiten
              </Link>
            </Button>
            <DeleteCustomerButton customerId={id} customerName={customer.name} />
          </div>
        )}
      </div>

      {/* Details grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Contact card */}
        <div className="rounded-xl border border-border/60 bg-card p-5 shadow-elevated space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Kontakt</h2>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <div className="text-sm">
                <p>{customer.street}</p>
                <p>{customer.zip} {customer.city}</p>
              </div>
            </div>
            {customer.phone && (
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 shrink-0 text-muted-foreground" />
                <a href={`tel:${customer.phone}`} className="text-sm hover:text-brand-500">{customer.phone}</a>
              </div>
            )}
            {customer.email && (
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 shrink-0 text-muted-foreground" />
                <a href={`mailto:${customer.email}`} className="text-sm hover:text-brand-500">{customer.email}</a>
              </div>
            )}
          </div>
        </div>

        {/* Contract card */}
        <div className="rounded-xl border border-border/60 bg-card p-5 shadow-elevated space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Vertrag</h2>
          <dl className="space-y-2.5">
            <Row label="Reinigungstyp" value={CUSTOMER_TYPE_LABELS[customer.customerType]} />
            <Row label="Vertragstyp" value={CONTRACT_TYPE_LABELS[customer.contractType]} />
            {customer.hourlyRate && (
              <Row label="Stundensatz" value={`${formatCurrency(Number(customer.hourlyRate))}/Std.`} />
            )}
            {customer.flatRate && (
              <Row label="Pauschale" value={formatCurrency(Number(customer.flatRate))} />
            )}
            <Row label="Angelegt" value={formatDate(customer.createdAt)} />
            <Row label="Geändert" value={formatDateTime(customer.updatedAt)} />
          </dl>
        </div>
      </div>

      {/* Notes */}
      {customer.notes && (
        <div className="rounded-xl border border-border/60 bg-card p-5 shadow-elevated">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Notizen</h2>
          <p className="text-sm text-foreground whitespace-pre-wrap">{customer.notes}</p>
        </div>
      )}

      {/* Jobs */}
      <div className="rounded-xl border border-border/60 bg-card shadow-elevated">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/60">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold">Aufträge</h2>
          </div>
          <Badge variant="secondary">{customer.jobs.length}</Badge>
        </div>
        {customer.jobs.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-muted-foreground">
            Noch keine Aufträge vorhanden.
          </div>
        ) : (
          <ul className="divide-y divide-border/60">
            {customer.jobs.map((job) => (
              <li key={job.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-muted/20">
                <div>
                  <p className="text-sm font-medium">{job.title}</p>
                  <p className="text-xs text-muted-foreground">{formatDateTime(job.scheduledAt)}</p>
                </div>
                <Badge variant={JOB_STATUS_VARIANTS[job.status]}>
                  {JOB_STATUS_LABELS[job.status]}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Separator />
      <p className="text-xs text-muted-foreground">Kunden-ID: {customer.id}</p>
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
