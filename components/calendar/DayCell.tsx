"use client";

import { isToday, isSameMonth, format } from "date-fns";
import { cn } from "@/lib/utils";
import { CalendarEvent } from "./CalendarEvent";
import type { CalendarJob } from "./CalendarView";

const DOT_COLOR: Record<string, string> = {
  GEPLANT: "bg-brand-400",
  IN_BEARBEITUNG: "bg-amber-400",
  ABGESCHLOSSEN: "bg-emerald-400",
  ABGESAGT: "bg-red-400",
};

interface DayCellProps {
  day: Date;
  currentDate: Date;
  jobs: CalendarJob[];
  onEmptyCellClick: (dateStr: string) => void;
  onMoreClick?: (dateStr: string) => void;
}

export function DayCell({ day, currentDate, jobs, onEmptyCellClick }: DayCellProps) {
  const todayDay = isToday(day);
  const inMonth = isSameMonth(day, currentDate);
  const dayStr = format(day, "yyyy-MM-dd");
  const isWeekend = day.getDay() === 0 || day.getDay() === 6;

  return (
    <div
      className={cn(
        "min-h-24 border-b border-r border-border/40 p-1.5 flex flex-col",
        !inMonth && "bg-muted/10",
        isWeekend && inMonth && "bg-muted/20 dark:bg-muted/10",
        todayDay && "bg-brand-50/60 dark:bg-brand-950/20"
      )}
      onClick={() => onEmptyCellClick(dayStr)}
    >
      {/* Date number */}
      <div className="mb-1 flex justify-end">
        <span
          className={cn(
            "flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium shrink-0",
            todayDay && "bg-brand-500 text-white font-bold",
            !todayDay && inMonth && "text-foreground",
            !inMonth && "text-muted-foreground/40"
          )}
        >
          {format(day, "d")}
        </span>
      </div>

      {/* Desktop: scrollable event list */}
      <div className="hidden sm:flex flex-col gap-0.5 overflow-y-auto overscroll-contain" style={{ maxHeight: "5rem" }}>
        {jobs.map((job) => (
          <CalendarEvent key={job.id} job={job} compact />
        ))}
      </div>

      {/* Mobile: colored dots */}
      <div className="flex sm:hidden items-center gap-1 mt-0.5 flex-wrap">
        {jobs.map((job) => (
          <span key={job.id} className={cn("h-1.5 w-1.5 rounded-full shrink-0", DOT_COLOR[job.status])} />
        ))}
      </div>
    </div>
  );
}
