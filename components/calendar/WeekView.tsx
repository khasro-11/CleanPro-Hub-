"use client";

import { useEffect, useRef } from "react";
import { isToday, isSameDay, format } from "date-fns";
import { de } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { getWeekDays, HOURS, HOUR_HEIGHT, HOUR_RANGE } from "@/lib/calendar/date-helpers";
import { positionJobs } from "@/lib/calendar/job-positioning";
import { CalendarEvent } from "./CalendarEvent";
import { CurrentTimeIndicator } from "./CurrentTimeIndicator";
import { JOB_STATUS_LABELS, JOB_STATUS_COLORS } from "@/lib/utils/labels";
import type { CalendarJob } from "./CalendarView";
import type { JobStatus } from "@prisma/client";

interface WeekViewProps {
  currentDate: Date;
  jobs: CalendarJob[];
  onHourClick: (dateTimeStr: string) => void;
}

const GRID_HEIGHT = (HOUR_RANGE.end - HOUR_RANGE.start) * HOUR_HEIGHT;

export function WeekView({ currentDate, jobs, onHourClick }: WeekViewProps) {
  const days = getWeekDays(currentDate);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Scroll to 8 AM on mount
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = (8 - HOUR_RANGE.start) * HOUR_HEIGHT;
    }
  }, []);

  return (
    <div className="rounded-xl border border-border/60 bg-card shadow-elevated overflow-hidden">
      {/* Day headers – sticky above scroll area */}
      <div className="grid border-b border-border/60" style={{ gridTemplateColumns: "48px 1fr" }}>
        <div className="border-r border-border/40" />
        <div className="grid grid-cols-7">
          {days.map((day) => (
            <div
              key={day.toISOString()}
              className={cn("py-2.5 text-center", isToday(day) && "bg-brand-50/80 dark:bg-brand-950/20")}
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {format(day, "EEE", { locale: de })}
              </p>
              <p className={cn(
                "mx-auto mt-1 flex h-7 w-7 items-center justify-center rounded-full text-sm font-medium",
                isToday(day) ? "bg-brand-500 text-white font-bold" : "text-foreground"
              )}>
                {format(day, "d")}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Status legend */}
      <div className="flex flex-wrap items-center gap-4 border-b border-border/60 px-4 py-2">
        {(["GEPLANT", "IN_BEARBEITUNG", "ABGESCHLOSSEN", "ABGESAGT"] as JobStatus[]).map((s) => (
          <div key={s} className="flex items-center gap-1.5">
            <span className={cn("inline-block h-2.5 w-2.5 rounded-sm border", JOB_STATUS_COLORS[s])} />
            <span className="text-xs text-muted-foreground">{JOB_STATUS_LABELS[s]}</span>
          </div>
        ))}
      </div>

      {/* Scrollable hour grid */}
      <div ref={scrollRef} className="overflow-y-auto max-h-[600px]">
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

          {/* Day columns */}
          <div className="grid grid-cols-7 relative" style={{ height: GRID_HEIGHT }}>
            {/* Hour grid lines */}
            {HOURS.map((h) => (
              <div
                key={h}
                className="absolute left-0 right-0 border-t border-border/30 pointer-events-none"
                style={{ top: (h - HOUR_RANGE.start) * HOUR_HEIGHT }}
              />
            ))}

            {days.map((day) => {
              const dayJobs = jobs.filter((j) => isSameDay(new Date(j.scheduledAt), day));
              const positioned = positionJobs(dayJobs);
              const isWeekend = day.getDay() === 0 || day.getDay() === 6;

              return (
                <div
                  key={day.toISOString()}
                  className={cn(
                    "relative border-r border-border/40 last:border-r-0",
                    isToday(day) && "bg-brand-50/40 dark:bg-brand-950/10",
                    isWeekend && !isToday(day) && "bg-muted/15"
                  )}
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const offsetY = e.clientY - rect.top + (scrollRef.current?.scrollTop ?? 0);
                    const h = Math.floor(offsetY / HOUR_HEIGHT) + HOUR_RANGE.start;
                    const dateStr = format(day, "yyyy-MM-dd");
                    onHourClick(`${dateStr}T${String(h).padStart(2, "0")}:00`);
                  }}
                >
                  {isToday(day) && <CurrentTimeIndicator />}
                  {positioned.map(({ job, left, width, top, height }) => (
                    <CalendarEvent
                      key={job.id}
                      job={job}
                      style={{ left, width, top, height, padding: "0 2px" }}
                    />
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
