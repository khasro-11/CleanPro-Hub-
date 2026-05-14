"use client";

import Link from "next/link";
import { format, addMinutes } from "date-fns";
import { cn } from "@/lib/utils";
import type { CalendarJob } from "./CalendarView";

const STATUS_BAR: Record<string, string> = {
  GEPLANT: "bg-brand-500",
  IN_BEARBEITUNG: "bg-amber-500",
  ABGESCHLOSSEN: "bg-emerald-500",
  ABGESAGT: "bg-red-400",
};

const STATUS_BG: Record<string, string> = {
  GEPLANT: "bg-brand-50 dark:bg-brand-950/40 border-brand-200/60 dark:border-brand-800/40 text-brand-900 dark:text-brand-100",
  IN_BEARBEITUNG: "bg-amber-50 dark:bg-amber-950/30 border-amber-200/60 dark:border-amber-800/40 text-amber-900 dark:text-amber-100",
  ABGESCHLOSSEN: "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200/60 dark:border-emerald-800/40 text-emerald-900 dark:text-emerald-100",
  ABGESAGT: "bg-red-50 dark:bg-red-950/20 border-red-200/60 dark:border-red-800/40 text-red-700 dark:text-red-300 opacity-70",
};

interface CalendarEventProps {
  job: CalendarJob;
  compact?: boolean;
  style?: React.CSSProperties;
  className?: string;
}

export function CalendarEvent({ job, compact = false, style, className }: CalendarEventProps) {
  const start = new Date(job.scheduledAt);
  const end = addMinutes(start, job.duration);
  const timeStr = format(start, "HH:mm");

  if (compact) {
    return (
      <Link
        href={`/auftraege/${job.id}`}
        onClick={(e) => e.stopPropagation()}
        title={`${timeStr} – ${job.title} (${job.customer.name})`}
        className={cn(
          "flex items-center gap-1 rounded border px-1.5 py-0.5 text-xs font-medium transition-[box-shadow] hover:shadow-sm",
          STATUS_BG[job.status],
          className
        )}
      >
        <span className={cn("h-3.5 w-1 shrink-0 rounded-full", STATUS_BAR[job.status])} />
        <span className="opacity-70 shrink-0">{timeStr}</span>
        <span className="truncate">{job.title}</span>
      </Link>
    );
  }

  return (
    <Link
      href={`/auftraege/${job.id}`}
      onClick={(e) => e.stopPropagation()}
      style={style}
      className={cn(
        "absolute flex flex-col overflow-hidden rounded border px-1.5 py-1 text-xs transition-[box-shadow,transform] hover:shadow-md hover:z-20 cursor-pointer",
        STATUS_BG[job.status],
        className
      )}
    >
      <div className={cn("absolute left-0 top-0 bottom-0 w-1", STATUS_BAR[job.status])} />
      <span className="pl-1.5 font-semibold leading-tight truncate">{job.title}</span>
      <span className="pl-1.5 opacity-70 mt-0.5 tabular-nums">
        {timeStr}–{format(end, "HH:mm")}
      </span>
      <span className="pl-1.5 opacity-60 truncate">{job.customer.name}</span>
    </Link>
  );
}
