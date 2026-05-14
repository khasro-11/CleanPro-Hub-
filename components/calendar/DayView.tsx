"use client";

import { useEffect, useRef } from "react";
import { isToday, format } from "date-fns";
import { de } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { HOURS, HOUR_HEIGHT, HOUR_RANGE } from "@/lib/calendar/date-helpers";
import { positionJobs } from "@/lib/calendar/job-positioning";
import { CalendarEvent } from "./CalendarEvent";
import { CurrentTimeIndicator } from "./CurrentTimeIndicator";
import { JOB_STATUS_LABELS, JOB_STATUS_COLORS } from "@/lib/utils/labels";
import type { CalendarJob } from "./CalendarView";
import type { JobStatus } from "@prisma/client";

interface DayViewProps {
  currentDate: Date;
  jobs: CalendarJob[];
  onHourClick: (dateTimeStr: string) => void;
}

const GRID_HEIGHT = (HOUR_RANGE.end - HOUR_RANGE.start) * HOUR_HEIGHT;

export function DayView({ currentDate, jobs, onHourClick }: DayViewProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const positioned = positionJobs(jobs);
  const todayDay = isToday(currentDate);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = (8 - HOUR_RANGE.start) * HOUR_HEIGHT;
    }
  }, []);

  return (
    <div className="rounded-xl border border-border/60 bg-card shadow-elevated overflow-hidden">
      {/* Header */}
      <div
        className={cn(
          "flex items-center justify-center gap-3 border-b border-border/60 py-3",
          todayDay && "bg-brand-50/80 dark:bg-brand-950/20"
        )}
      >
        <p className="text-sm font-semibold capitalize">
          {format(currentDate, "EEEE, d. MMMM yyyy", { locale: de })}
        </p>
        {todayDay && (
          <span className="rounded-full bg-brand-500 px-2 py-0.5 text-[11px] font-semibold text-white">
            Heute
          </span>
        )}
      </div>

      {/* Scrollable time grid */}
      <div ref={scrollRef} className="overflow-y-auto max-h-[640px]">
        <div className="grid" style={{ gridTemplateColumns: "48px 1fr", height: GRID_HEIGHT }}>
          {/* Time axis */}
          <div className="relative border-r border-border/40">
            {HOURS.map((h) => (
              <div
                key={h}
                className="absolute right-2 text-[10px] text-muted-foreground tabular-nums -translate-y-1/2"
                style={{ top: (h - HOUR_RANGE.start) * HOUR_HEIGHT }}
              >
                {String(h).padStart(2, "0")}:00
              </div>
            ))}
          </div>

          {/* Single day column */}
          <div
            className={cn(
              "relative",
              todayDay && "bg-brand-50/30 dark:bg-brand-950/10"
            )}
            style={{ height: GRID_HEIGHT }}
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const offsetY = e.clientY - rect.top + (scrollRef.current?.scrollTop ?? 0);
              const h = Math.floor(offsetY / HOUR_HEIGHT) + HOUR_RANGE.start;
              const dateStr = format(currentDate, "yyyy-MM-dd");
              onHourClick(`${dateStr}T${String(h).padStart(2, "0")}:00`);
            }}
          >
            {/* Hour grid lines */}
            {HOURS.map((h) => (
              <div
                key={h}
                className="absolute left-0 right-0 border-t border-border/30 pointer-events-none"
                style={{ top: (h - HOUR_RANGE.start) * HOUR_HEIGHT }}
              />
            ))}

            {todayDay && <CurrentTimeIndicator />}

            {positioned.map(({ job, left, width, top, height }) => (
              <CalendarEvent
                key={job.id}
                job={job}
                style={{ left, width, top, height, padding: "0 4px" }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Footer: legend + count */}
      <div className="flex flex-wrap items-center gap-4 border-t border-border/60 px-4 py-2">
        {(["GEPLANT", "IN_BEARBEITUNG", "ABGESCHLOSSEN", "ABGESAGT"] as JobStatus[]).map((s) => (
          <div key={s} className="flex items-center gap-1.5">
            <span className={cn("inline-block h-2.5 w-2.5 rounded-sm border", JOB_STATUS_COLORS[s])} />
            <span className="text-xs text-muted-foreground">{JOB_STATUS_LABELS[s]}</span>
          </div>
        ))}
        <span className="ml-auto text-xs text-muted-foreground">
          {jobs.length === 0
            ? "Keine Aufträge an diesem Tag"
            : `${jobs.length} Auftrag${jobs.length !== 1 ? "e" : ""}`}
        </span>
      </div>
    </div>
  );
}
