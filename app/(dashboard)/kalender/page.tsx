import { Suspense } from "react";
import type { Metadata } from "next";
import { requireAuth } from "@/lib/auth/session";
import { CalendarView } from "@/components/calendar/CalendarView";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = { title: "Kalender" };

function CalendarSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-8 w-64" />
      <div className="rounded-xl border border-border/60 bg-card shadow-elevated p-4 space-y-3">
        <Skeleton className="h-8 w-full" />
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    </div>
  );
}

export default async function KalenderPage() {
  const session = await requireAuth();
  const isAdmin = session.user.role === "ADMIN";

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Kalender</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Alle Aufträge im Monats-, Wochen- und Tagesüberblick.
        </p>
      </div>

      <Suspense fallback={<CalendarSkeleton />}>
        <CalendarView isAdmin={isAdmin} />
      </Suspense>
    </div>
  );
}
