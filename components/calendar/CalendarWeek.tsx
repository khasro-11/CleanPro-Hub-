"use client";

import Link from "next/link";
import {
  startOfWeek, endOfWeek, eachDayOfInterval,
  isToday, format, isSameDay, addMinutes,
} from "date-fns";
import { de } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { JOB_STATUS_COLORS } from "@/lib/utils/labels";
import type { CalendarJob } from "./CalendarView";

interface CalendarWeekProps {
  currentDate: Date;
  jobs: CalendarJob[];
}

export function CalendarWeek({ currentDate, jobs }: CalendarWeekProps) {
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

  return (
    <div className="rounded-xl border border-border/60 bg-card shadow-elevated overflow-hidden">
      {/* Day headers */}
      <div className="grid grid-cols-7 border-b border-border/60">
        {days.map((day) => (
          <div
            key={day.toISOString()}
            className={cn(
              "py-3 text-center",
              isToday(day) && "bg-brand-500/5"
            )}
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {format(day, "EEE", { locale: de })}
            </p>
            <p
              className={cn(
                "mx-auto mt-1 flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium",
                isToday(day) ? "bg-brand-500 text-white font-bold" : "text-foreground"
              )}
            >
              {format(day, "d")}
            </p>
          </div>
        ))}
      </div>

      {/* Job cards per day */}
      <div className="grid grid-cols-7 min-h-64">
        {days.map((day) => {
          const dayJobs = jobs
            .filter((j) => isSameDay(new Date(j.scheduledAt), day))
            .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());

          return (
            <div
              key={day.toISOString()}
              className={cn(
                "border-r border-border/40 p-2 space-y-1.5 last:border-r-0",
                isToday(day) && "bg-brand-500/5"
              )}
            >
              {dayJobs.length === 0 && (
                <p className="pt-4 text-center text-xs text-muted-foreground/40">–</p>
              )}
              {dayJobs.map((job) => {
                const start = new Date(job.scheduledAt);
                const end = addMinutes(start, job.duration);
                return (
                  <Link
                    key={job.id}
                    href={`/auftraege/${job.id}`}
                    className={cn(
                      "block rounded-md border px-2 py-1.5 text-xs transition-opacity hover:opacity-80",
                      JOB_STATUS_COLORS[job.status]
                    )}
                  >
                    <p className="font-semibold truncate">{job.title}</p>
                    <p className="opacity-80 mt-0.5">
                      {format(start, "HH:mm")}–{format(end, "HH:mm")}
                    </p>
                    <p className="truncate opacity-70">{job.customer.name}</p>
                  </Link>
                );
              })}
            </div>
          );
        })}
      </div>

      <div className="border-t border-border/60 px-4 py-2.5 text-xs text-muted-foreground">
        {format(weekStart, "d. MMM", { locale: de })} – {format(weekEnd, "d. MMM yyyy", { locale: de })}
      </div>
    </div>
  );
}
