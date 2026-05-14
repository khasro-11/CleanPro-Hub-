import type { CalendarJob } from "@/components/calendar/CalendarView";
import { HOUR_HEIGHT, HOUR_RANGE } from "./date-helpers";

export interface PositionedJob {
  job: CalendarJob;
  left: string;
  width: string;
  top: number;
  height: number;
}

function startMs(job: CalendarJob): number {
  return new Date(job.scheduledAt).getTime();
}

function endMs(job: CalendarJob): number {
  return startMs(job) + job.duration * 60_000;
}

function overlaps(a: CalendarJob, b: CalendarJob): boolean {
  return startMs(a) < endMs(b) && endMs(a) > startMs(b);
}

export function positionJobs(jobs: CalendarJob[]): PositionedJob[] {
  if (!jobs.length) return [];

  const sorted = [...jobs].sort((a, b) => startMs(a) - startMs(b));
  const result: PositionedJob[] = [];
  const processed = new Set<string>();

  for (const job of sorted) {
    if (processed.has(job.id)) continue;

    // Collect cluster of transitively overlapping jobs
    const cluster: CalendarJob[] = [job];
    processed.add(job.id);

    for (let i = 0; i < cluster.length; i++) {
      for (const other of sorted) {
        if (!processed.has(other.id) && overlaps(cluster[i], other)) {
          cluster.push(other);
          processed.add(other.id);
        }
      }
    }

    // Greedy column assignment within cluster
    const colOf = new Map<string, number>();
    const colEnd: number[] = [];

    for (const j of cluster) {
      const s = startMs(j);
      let col = colEnd.findIndex((e) => e <= s);
      if (col === -1) {
        col = colEnd.length;
        colEnd.push(0);
      }
      colEnd[col] = endMs(j);
      colOf.set(j.id, col);
    }

    const totalCols = colEnd.length;

    for (const j of cluster) {
      const col = colOf.get(j.id)!;
      const startDate = new Date(j.scheduledAt);
      const startHour = startDate.getHours() + startDate.getMinutes() / 60;
      result.push({
        job: j,
        left: `${(col / totalCols) * 100}%`,
        width: `${(1 / totalCols) * 100}%`,
        top: Math.max(0, (startHour - HOUR_RANGE.start) * HOUR_HEIGHT),
        height: Math.max(HOUR_HEIGHT / 2, (j.duration / 60) * HOUR_HEIGHT),
      });
    }
  }

  return result;
}
