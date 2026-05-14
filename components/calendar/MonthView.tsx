"use client";

import { isSameDay, format } from "date-fns";
import { de } from "date-fns/locale";
import { getMonthGrid } from "@/lib/calendar/date-helpers";
import { DayCell } from "./DayCell";
import { JOB_STATUS_LABELS } from "@/lib/utils/labels";
import { JOB_STATUS_COLORS } from "@/lib/utils/labels";
import { cn } from "@/lib/utils";
import type { CalendarJob } from "./CalendarView";
import type { JobStatus } from "@prisma/client";

const WEEKDAYS = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];

interface MonthViewProps {
  currentDate: Date;
  jobs: CalendarJob[];
  onEmptyCellClick: (dateStr: string) => void;
  onDayClick: (dateStr: string) => void;
}

export function MonthView({ currentDate, jobs, onEmptyCellClick, onDayClick }: MonthViewProps) {
  const days = getMonthGrid(currentDate);

  return (
    <div className="rounded-xl border border-border/60 bg-card shadow-elevated overflow-hidden">
      {/* Weekday headers */}
      <div className="grid grid-cols-7 border-b border-border/60">
        {WEEKDAYS.map((d, i) => (
          <div
            key={d}
            className={cn(
              "py-2.5 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground",
              i >= 5 && "text-muted-foreground/60"
            )}
          >
            {d}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7">
        {days.map((day, idx) => {
          const dayJobs = jobs
            .filter((j) => isSameDay(new Date(j.scheduledAt), day))
            .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());

          return (
            <div
              key={idx}
              className={cn(
                "border-r border-border/40 last-of-type:border-r-0",
                idx % 7 === 6 && "border-r-0"
              )}
            >
              <DayCell
                day={day}
                currentDate={currentDate}
                jobs={dayJobs}
                onEmptyCellClick={onEmptyCellClick}
                onMoreClick={onDayClick}
              />
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 border-t border-border/60 px-4 py-2.5">
        {(["GEPLANT", "IN_BEARBEITUNG", "ABGESCHLOSSEN", "ABGESAGT"] as JobStatus[]).map((s) => (
          <div key={s} className="flex items-center gap-1.5">
            <span className={cn("inline-block h-2.5 w-2.5 rounded-sm border", JOB_STATUS_COLORS[s])} />
            <span className="text-xs text-muted-foreground">{JOB_STATUS_LABELS[s]}</span>
          </div>
        ))}
        <p className="ml-auto text-xs text-muted-foreground">
          {format(currentDate, "MMMM yyyy", { locale: de })}
        </p>
      </div>
    </div>
  );
}
