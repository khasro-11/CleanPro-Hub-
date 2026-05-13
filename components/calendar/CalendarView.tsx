"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { addMonths, addWeeks, subMonths, subWeeks, format, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from "date-fns";
import { de } from "date-fns/locale";
import { ChevronLeft, ChevronRight, CalendarDays, CalendarRange } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarMonth } from "./CalendarMonth";
import { CalendarWeek } from "./CalendarWeek";
import type { JobStatus, RecurrenceType } from "@prisma/client";

export interface CalendarJob {
  id: string;
  title: string;
  scheduledAt: string;
  duration: number;
  status: JobStatus;
  recurrence: RecurrenceType;
  customer: { id: string; name: string };
  assignments: { employee: { id: string; firstName: string; lastName: string } }[];
}

type ViewMode = "month" | "week";

function toISODate(d: Date) {
  return format(d, "yyyy-MM-dd");
}

export function CalendarView() {
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [currentDate, setCurrentDate] = useState(new Date());

  const rangeStart =
    viewMode === "month"
      ? startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 })
      : startOfWeek(currentDate, { weekStartsOn: 1 });

  const rangeEnd =
    viewMode === "month"
      ? endOfWeek(endOfMonth(currentDate), { weekStartsOn: 1 })
      : endOfWeek(currentDate, { weekStartsOn: 1 });

  const from = toISODate(rangeStart);
  const to = toISODate(rangeEnd);

  const { data, isLoading } = useQuery<{ jobs: CalendarJob[] }>({
    queryKey: ["calendar-jobs", from, to],
    queryFn: async () => {
      const res = await fetch(`/api/jobs?from=${from}&to=${to}&limit=500`);
      const json = (await res.json()) as { ok: boolean; data: { jobs: CalendarJob[] } };
      if (!json.ok) throw new Error("Fehler beim Laden der Kalendereinträge.");
      return json.data;
    },
  });

  function prev() {
    if (viewMode === "month") setCurrentDate((d) => subMonths(d, 1));
    else setCurrentDate((d) => subWeeks(d, 1));
  }

  function next() {
    if (viewMode === "month") setCurrentDate((d) => addMonths(d, 1));
    else setCurrentDate((d) => addWeeks(d, 1));
  }

  function goToToday() {
    setCurrentDate(new Date());
  }

  const title =
    viewMode === "month"
      ? format(currentDate, "MMMM yyyy", { locale: de })
      : `KW ${format(currentDate, "w")} · ${format(currentDate, "MMMM yyyy", { locale: de })}`;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={goToToday}>
            Heute
          </Button>
          <Button variant="ghost" size="icon" onClick={prev} aria-label="Vorherige Periode">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={next} aria-label="Nächste Periode">
            <ChevronRight className="h-4 w-4" />
          </Button>
          <h2 className="text-base font-semibold capitalize">{title}</h2>
        </div>

        <div className="flex items-center rounded-lg border border-border p-0.5 gap-0.5">
          <Button
            variant={viewMode === "month" ? "default" : "ghost"}
            size="sm"
            className={viewMode === "month" ? "bg-brand-500 hover:bg-brand-600" : ""}
            onClick={() => setViewMode("month")}
          >
            <CalendarDays className="mr-1.5 h-4 w-4" />
            Monat
          </Button>
          <Button
            variant={viewMode === "week" ? "default" : "ghost"}
            size="sm"
            className={viewMode === "week" ? "bg-brand-500 hover:bg-brand-600" : ""}
            onClick={() => setViewMode("week")}
          >
            <CalendarRange className="mr-1.5 h-4 w-4" />
            Woche
          </Button>
        </div>
      </div>

      {/* Calendar body */}
      {isLoading ? (
        <div className="rounded-xl border border-border/60 shadow-elevated p-4 space-y-3">
          <Skeleton className="h-8 w-full" />
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : viewMode === "month" ? (
        <CalendarMonth currentDate={currentDate} jobs={data?.jobs ?? []} />
      ) : (
        <CalendarWeek currentDate={currentDate} jobs={data?.jobs ?? []} />
      )}
    </div>
  );
}
