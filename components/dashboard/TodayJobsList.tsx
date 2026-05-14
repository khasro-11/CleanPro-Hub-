import { CalendarX } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatTime } from "@/lib/utils/format";
import { JOB_STATUS_LABELS, JOB_STATUS_COLORS } from "@/lib/utils/labels";
import { getTodayJobs } from "@/lib/dashboard/queries";
import { cn } from "@/lib/utils";

type TodayJob = Awaited<ReturnType<typeof getTodayJobs>>[number];

interface TodayJobsListProps {
  jobs: TodayJob[];
}

export function TodayJobsList({ jobs }: TodayJobsListProps) {
  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        Heutige Termine
      </h2>

      {jobs.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 py-10 text-muted-foreground">
          <CalendarX className="h-8 w-8 opacity-40" />
          <p className="text-sm">Heute keine Termine</p>
        </div>
      ) : (
        <ul className="flex flex-col divide-y divide-border/50">
          {jobs.map((job) => {
            const employees = job.assignments.map(
              (a) => `${a.employee.firstName} ${a.employee.lastName}`
            );
            return (
              <li key={job.id} className="flex items-start gap-3 py-3">
                <span className="min-w-[46px] pt-0.5 text-sm font-semibold tabular-nums text-foreground">
                  {formatTime(job.scheduledAt)}
                </span>
                <div className="flex flex-1 flex-col gap-0.5 min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">
                    {job.customer.name} — {job.title}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {employees.length > 0 ? employees.join(", ") : "Kein Mitarbeiter"}
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className={cn("shrink-0 text-xs", JOB_STATUS_COLORS[job.status])}
                >
                  {JOB_STATUS_LABELS[job.status]}
                </Badge>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
