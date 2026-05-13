"use client";

import Link from "next/link";
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameMonth, isToday, format, isSameDay,
} from "date-fns";
import { de } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { JOB_STATUS_COLORS } from "@/lib/utils/labels";
import type { CalendarJob } from "./CalendarView";

interface CalendarMonthProps {
  currentDate: Date;
  jobs: CalendarJob[];
}

const WEEKDAYS = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];

export function CalendarMonth({ currentDate, jobs }: CalendarMonthProps) {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  return (
    <div className="rounded-xl border border-border/60 bg-card shadow-elevated overflow-hidden">
      {/* Weekday headers */}
      <div className="grid grid-cols-7 border-b border-border/60">
        {WEEKDAYS.map((d) => (
          <div key={d} className="py-2.5 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {d}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7">
        {days.map((day, idx) => {
          const dayJobs = jobs.filter((j) => isSameDay(new Date(j.scheduledAt), day));
          const isCurrentMonth = isSameMonth(day, currentDate);
          const todayDay = isToday(day);

          return (
            <div
              key={idx}
              className={cn(
                "min-h-24 border-b border-r border-border/40 p-1.5 last:border-r-0",
                !isCurrentMonth && "bg-muted/20",
                idx % 7 === 6 && "border-r-0"
              )}
            >
              <div className="mb-1 flex justify-end">
                <span
                  className={cn(
                    "flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium",
                    todayDay && "bg-brand-500 text-white font-bold",
                    !todayDay && isCurrentMonth && "text-foreground",
                    !isCurrentMonth && "text-muted-foreground/50"
                  )}
                >
                  {format(day, "d")}
                </span>
              </div>

              <div className="space-y-0.5">
                {dayJobs.slice(0, 3).map((job) => (
                  <Link
                    key={job.id}
                    href={`/auftraege/${job.id}`}
                    onClick={(e) => e.stopPropagation()}
                    className={cn(
                      "block truncate rounded px-1.5 py-0.5 text-xs font-medium border transition-opacity hover:opacity-80",
                      JOB_STATUS_COLORS[job.status]
                    )}
                    title={`${format(new Date(job.scheduledAt), "HH:mm")} – ${job.title} (${job.customer.name})`}
                  >
                    <span className="mr-1 opacity-70">{format(new Date(job.scheduledAt), "HH:mm")}</span>
                    {job.title}
                  </Link>
                ))}
                {dayJobs.length > 3 && (
                  <p className="pl-1.5 text-xs text-muted-foreground">
                    +{dayJobs.length - 3} weitere
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 border-t border-border/60 px-4 py-3">
        {(["GEPLANT", "IN_BEARBEITUNG", "ABGESCHLOSSEN", "ABGESAGT"] as const).map((s) => (
          <div key={s} className="flex items-center gap-1.5">
            <span className={cn("inline-block h-2.5 w-2.5 rounded-sm border", JOB_STATUS_COLORS[s])} />
            <span className="text-xs text-muted-foreground">
              {s === "GEPLANT" ? "Geplant" : s === "IN_BEARBEITUNG" ? "In Bearbeitung" : s === "ABGESCHLOSSEN" ? "Abgeschlossen" : "Abgesagt"}
            </span>
          </div>
        ))}
        <p className="ml-auto text-xs text-muted-foreground">
          {format(currentDate, "MMMM yyyy", { locale: de })}
        </p>
      </div>
    </div>
  );
}
