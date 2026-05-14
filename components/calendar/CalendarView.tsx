"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format, parseISO, addMonths, subMonths, addWeeks, subWeeks, addDays, subDays } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import type { JobStatus, RecurrenceType } from "@prisma/client";
import { getDateRange, formatPeriod, type CalendarView as CalendarViewType } from "@/lib/calendar/date-helpers";
import { CalendarHeader } from "./CalendarHeader";
import { CalendarFilters } from "./CalendarFilters";
import { MonthView } from "./MonthView";
import { WeekView } from "./WeekView";
import { DayView } from "./DayView";
import { NewJobDialog } from "./NewJobDialog";

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

const DEFAULT_STATUSES = "GEPLANT,IN_BEARBEITUNG,ABGESCHLOSSEN";

async function fetchJobs(
  fromStr: string, toStr: string,
  employees: string, statuses: string, search: string
): Promise<CalendarJob[]> {
  const p = new URLSearchParams({ from: fromStr, to: toStr, limit: "500" });
  if (employees) p.set("employees", employees);
  if (statuses) p.set("statuses", statuses);
  if (search) p.set("search", search);
  const res = await fetch(`/api/jobs?${p}`);
  const json = await res.json() as { ok: boolean; data: { jobs: CalendarJob[] } };
  if (!json.ok) throw new Error("Fehler beim Laden der Kalendereinträge.");
  return json.data.jobs;
}

interface CalendarViewProps {
  isAdmin: boolean;
}

export function CalendarView({ isAdmin }: CalendarViewProps) {
  const router = useRouter();
  const params = useSearchParams();
  const queryClient = useQueryClient();

  const view = (params.get("view") ?? "monat") as CalendarViewType;
  const dateParam = params.get("date");
  const currentDate = dateParam ? parseISO(dateParam) : new Date();
  const employeesParam = params.get("employees") ?? "";
  const statusesParam = params.get("statuses") ?? DEFAULT_STATUSES;
  const searchParam = params.get("search") ?? "";

  const [dialogOpen, setDialogOpen] = useState(false);
  const [prefillDateTime, setPrefillDateTime] = useState("");

  function updateParams(updates: Record<string, string>) {
    const p = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(updates)) {
      if (!v) p.delete(k); else p.set(k, v);
    }
    router.push(`?${p.toString()}`, { scroll: false });
  }

  const { from, to } = getDateRange(currentDate, view);
  const fromStr = format(from, "yyyy-MM-dd");
  const toStr = format(to, "yyyy-MM-dd");

  const { data: jobs, isLoading } = useQuery<CalendarJob[]>({
    queryKey: ["calendar-jobs", fromStr, toStr, employeesParam, statusesParam, searchParam],
    queryFn: () => fetchJobs(fromStr, toStr, employeesParam, statusesParam, searchParam),
  });

  // Prefetch adjacent periods — deps are stable strings so no exhaustive-deps concern
  useEffect(() => {
    const cd = dateParam ? parseISO(dateParam) : new Date();
    const prefetch = (d: Date) => {
      const { from: f, to: t } = getDateRange(d, view);
      const fs = format(f, "yyyy-MM-dd");
      const ts = format(t, "yyyy-MM-dd");
      queryClient.prefetchQuery({
        queryKey: ["calendar-jobs", fs, ts, employeesParam, statusesParam, searchParam],
        queryFn: () => fetchJobs(fs, ts, employeesParam, statusesParam, searchParam),
      });
    };
    if (view === "monat") { prefetch(addMonths(cd, 1)); prefetch(subMonths(cd, 1)); }
    else if (view === "woche") { prefetch(addWeeks(cd, 1)); prefetch(subWeeks(cd, 1)); }
    else { prefetch(addDays(cd, 1)); prefetch(subDays(cd, 1)); }
  }, [dateParam, view, employeesParam, statusesParam, searchParam, queryClient]);

  function navigate(dir: 1 | -1) {
    let d: Date;
    if (view === "monat") d = dir === 1 ? addMonths(currentDate, 1) : subMonths(currentDate, 1);
    else if (view === "woche") d = dir === 1 ? addWeeks(currentDate, 1) : subWeeks(currentDate, 1);
    else d = dir === 1 ? addDays(currentDate, 1) : subDays(currentDate, 1);
    updateParams({ date: format(d, "yyyy-MM-dd") });
  }

  function openDialog(dateTimeStr: string) {
    setPrefillDateTime(dateTimeStr);
    setDialogOpen(true);
  }

  const allJobs = jobs ?? [];
  const hasFilters = employeesParam || statusesParam !== DEFAULT_STATUSES || searchParam;

  return (
    <div className="space-y-3">
      <CalendarHeader
        view={view}
        periodTitle={formatPeriod(currentDate, view)}
        onViewChange={(v) => updateParams({ view: v, date: format(currentDate, "yyyy-MM-dd") })}
        onPrev={() => navigate(-1)}
        onNext={() => navigate(1)}
        onToday={() => updateParams({ date: format(new Date(), "yyyy-MM-dd") })}
      />

      <CalendarFilters
        isAdmin={isAdmin}
        selectedEmployees={employeesParam ? employeesParam.split(",") : []}
        selectedStatuses={statusesParam ? statusesParam.split(",") : []}
        search={searchParam}
        onEmployeesChange={(ids) => updateParams({ employees: ids.join(",") })}
        onStatusesChange={(ss) => updateParams({ statuses: ss.join(",") })}
        onSearchChange={(s) => updateParams({ search: s })}
        onReset={() => updateParams({ employees: "", statuses: DEFAULT_STATUSES, search: "" })}
      />

      {isLoading ? (
        <div className="rounded-xl border border-border/60 bg-card shadow-elevated p-4 space-y-3">
          <Skeleton className="h-8 w-full" />
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : allJobs.length === 0 && hasFilters ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-border/60 bg-card shadow-elevated py-20 gap-3">
          <p className="text-sm text-muted-foreground">Keine Termine im gewählten Zeitraum.</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => updateParams({ employees: "", statuses: DEFAULT_STATUSES, search: "" })}
          >
            Filter zurücksetzen
          </Button>
        </div>
      ) : view === "monat" ? (
        <MonthView
          currentDate={currentDate}
          jobs={allJobs}
          onEmptyCellClick={(d) => openDialog(`${d}T08:00`)}
          onDayClick={(d) => updateParams({ view: "tag", date: d })}
        />
      ) : view === "woche" ? (
        <WeekView
          currentDate={currentDate}
          jobs={allJobs}
          onHourClick={openDialog}
        />
      ) : (
        <DayView
          currentDate={currentDate}
          jobs={allJobs}
          onHourClick={openDialog}
        />
      )}

      <NewJobDialog
        open={dialogOpen}
        prefillDateTime={prefillDateTime}
        onClose={() => setDialogOpen(false)}
      />
    </div>
  );
}
