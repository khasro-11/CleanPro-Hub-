import type { Metadata } from "next";
import { requireAuth } from "@/lib/auth/session";
import { CalendarView } from "@/components/calendar/CalendarView";

export const metadata: Metadata = { title: "Kalender" };

export default async function KalenderPage() {
  await requireAuth();

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Kalender</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Alle Aufträge im Monats- und Wochenüberblick.
        </p>
      </div>

      <CalendarView />
    </div>
  );
}
