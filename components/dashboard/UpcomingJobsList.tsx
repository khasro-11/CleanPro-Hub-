import { CalendarCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils/format";
import { JOB_STATUS_LABELS, JOB_STATUS_COLORS } from "@/lib/utils/labels";
import { getUpcomingJobs } from "@/lib/dashboard/queries";
import { cn } from "@/lib/utils";

type UpcomingJob = Awaited<ReturnType<typeof getUpcomingJobs>>[number];

interface UpcomingJobsListProps {
  jobs: UpcomingJob[];
}

export function UpcomingJobsList({ jobs }: UpcomingJobsListProps) {
  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        Anstehende Aufträge (7 Tage)
      </h2>

      {jobs.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 py-10 text-muted-foreground">
          <CalendarCheck className="h-8 w-8 opacity-40" />
          <p className="text-sm">Keine anstehenden Aufträge</p>
        </div>
      ) : (
        <ul className="flex flex-col divide-y divide-border/50">
          {jobs.map((job) => (
            <li key={job.id} className="flex items-start gap-3 py-3">
              <span className="min-w-[80px] pt-0.5 text-xs tabular-nums text-muted-foreground">
                {formatDate(job.scheduledAt)}
              </span>
              <div className="flex flex-1 flex-col gap-0.5 min-w-0">
                <p className="truncate text-sm font-medium text-foreground">
                  {job.customer.name} — {job.title}
                </p>
              </div>
              <Badge
                variant="outline"
                className={cn("shrink-0 text-xs", JOB_STATUS_COLORS[job.status])}
              >
                {JOB_STATUS_LABELS[job.status]}
              </Badge>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
