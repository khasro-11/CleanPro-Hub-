import type { Metadata } from "next";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { requireAuth } from "@/lib/auth/session";
import { getEmployeeByUserId } from "@/lib/time-entries/queries";
import { getEmployeeHoursSummaryForEntry } from "@/lib/time-entries/queries";
import { CheckInCard } from "@/components/time/CheckInCard";
import { ActiveEntriesWidget } from "@/components/time/ActiveEntriesWidget";
import { TimeEntriesTable } from "@/components/time/TimeEntriesTable";
import { HoursSummaryCard } from "@/components/time/HoursSummaryCard";

export const metadata: Metadata = { title: "Zeiterfassung" };

export default async function ZeiterfassungPage() {
  const session = await requireAuth();
  const isAdmin = session.user.role === "ADMIN";

  if (isAdmin) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Zeiterfassung</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Übersicht aller Arbeitsstunden und aktiver Mitarbeiter.
          </p>
        </div>

        {/* Who's active right now */}
        <Suspense fallback={<Skeleton className="h-48 w-full rounded-xl" />}>
          <ActiveEntriesWidget />
        </Suspense>

        {/* Full entries table */}
        <div className="rounded-xl border border-border/60 bg-card p-5 shadow-elevated space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Alle Einträge</h2>
          <Suspense fallback={<Skeleton className="h-64 w-full" />}>
            <TimeEntriesTable isAdmin={true} />
          </Suspense>
        </div>
      </div>
    );
  }

  // MITARBEITER view — look up their employee record
  const employee = await getEmployeeByUserId(session.user.id);

  if (!employee) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Zeiterfassung</h1>
        </div>
        <div className="rounded-xl border border-border/60 bg-card p-10 shadow-elevated text-center">
          <p className="text-muted-foreground text-sm">
            Ihr Konto ist noch keinem Mitarbeiter-Profil zugeordnet. Bitte wenden Sie sich an den Administrator.
          </p>
        </div>
      </div>
    );
  }

  const summary = await getEmployeeHoursSummaryForEntry(employee.id);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Zeiterfassung</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Willkommen, {employee.firstName}. Stempeln Sie ein und aus.
        </p>
      </div>

      {/* Check-in card */}
      <Suspense fallback={<Skeleton className="h-40 w-full rounded-xl" />}>
        <CheckInCard employeeId={employee.id} />
      </Suspense>

      {/* Hours summary */}
      <HoursSummaryCard employeeId={employee.id} initialData={summary} />

      {/* Own entries */}
      <div className="rounded-xl border border-border/60 bg-card p-5 shadow-elevated space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Meine Einträge</h2>
        <Suspense fallback={<Skeleton className="h-64 w-full" />}>
          <TimeEntriesTable isAdmin={false} employeeId={employee.id} />
        </Suspense>
      </div>
    </div>
  );
}
