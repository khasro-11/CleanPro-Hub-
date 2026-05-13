"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { MapPin, Activity } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateTime, formatInitials } from "@/lib/utils/format";
import type { ApiResponse } from "@/types/api";
import type { TimeEntryWithDetails } from "@/lib/time-entries/queries";

export function ActiveEntriesWidget() {
  const { data, isLoading } = useQuery<TimeEntryWithDetails[]>({
    queryKey: ["active-entries-all"],
    queryFn: async () => {
      const res = await fetch("/api/time-entries?activeOnly=true&limit=100");
      const json = (await res.json()) as ApiResponse<{ entries: TimeEntryWithDetails[] }>;
      if (!json.ok) throw new Error(json.error.message);
      return json.data.entries;
    },
    refetchInterval: 60000,
  });

  if (isLoading) {
    return (
      <div className="rounded-xl border border-border/60 bg-card p-5 shadow-elevated space-y-3">
        <Skeleton className="h-5 w-40" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="space-y-1 flex-1">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  const entries = data ?? [];

  return (
    <div className="rounded-xl border border-border/60 bg-card shadow-elevated">
      <div className="flex items-center gap-2 px-5 py-4 border-b border-border/60">
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <Activity className="h-4 w-4 text-muted-foreground" />
        </div>
        <h2 className="text-sm font-semibold">Aktuell aktive Mitarbeiter</h2>
        <Badge variant="secondary" className="ml-auto">{entries.length}</Badge>
      </div>

      {entries.length === 0 ? (
        <div className="px-5 py-10 text-center text-sm text-muted-foreground">
          Derzeit keine Mitarbeiter eingecheckt.
        </div>
      ) : (
        <ul className="divide-y divide-border/60">
          {entries.map((entry) => (
            <li key={entry.id} className="flex items-center gap-3 px-5 py-3.5">
              <Avatar className="h-9 w-9 shrink-0">
                <AvatarFallback className="bg-brand-500/10 text-brand-600 text-xs font-semibold">
                  {formatInitials(entry.employee.firstName, entry.employee.lastName)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <Link
                  href={`/mitarbeiter/${entry.employee.id}`}
                  className="text-sm font-medium hover:text-brand-500 truncate block"
                >
                  {entry.employee.firstName} {entry.employee.lastName}
                </Link>
                <p className="text-xs text-muted-foreground">
                  seit {formatDateTime(entry.checkIn)}
                  {entry.job && ` · ${entry.job.title}`}
                </p>
              </div>
              {entry.latLng && (
                <span title="GPS erfasst">
                  <MapPin className="h-3.5 w-3.5 text-brand-400 shrink-0" />
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
