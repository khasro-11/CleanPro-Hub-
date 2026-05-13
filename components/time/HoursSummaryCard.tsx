"use client";

import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { Clock, TrendingUp, Calendar } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDuration } from "@/lib/utils/format";
import type { ApiResponse } from "@/types/api";

interface HoursSummary {
  weekMinutes: number;
  monthMinutes: number;
  totalMinutes: number;
}

interface HoursSummaryCardProps {
  employeeId: string;
  initialData?: HoursSummary;
}

export function HoursSummaryCard({ employeeId, initialData }: HoursSummaryCardProps) {
  const { data, isLoading } = useQuery<HoursSummary>({
    queryKey: ["hours-summary", employeeId],
    queryFn: async () => {
      const res = await fetch(`/api/time-entries/summary?employeeId=${employeeId}`);
      const json = (await res.json()) as ApiResponse<HoursSummary>;
      if (!json.ok) throw new Error(json.error.message);
      return json.data;
    },
    initialData,
  });

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border/60 bg-card p-5 shadow-elevated space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-7 w-20" />
          </div>
        ))}
      </div>
    );
  }

  const summary = data ?? { weekMinutes: 0, monthMinutes: 0, totalMinutes: 0 };

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <SummaryCard
        icon={<Clock className="h-5 w-5 text-brand-500" />}
        label="Diese Woche"
        value={formatDuration(summary.weekMinutes)}
      />
      <SummaryCard
        icon={<Calendar className="h-5 w-5 text-amber-500" />}
        label="Dieser Monat"
        value={formatDuration(summary.monthMinutes)}
      />
      <SummaryCard
        icon={<TrendingUp className="h-5 w-5 text-emerald-500" />}
        label="Gesamt"
        value={formatDuration(summary.totalMinutes)}
      />
    </div>
  );
}

function SummaryCard({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border/60 bg-card p-5 shadow-elevated">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      </div>
      <p className="text-2xl font-bold tracking-tight">{value}</p>
    </div>
  );
}
