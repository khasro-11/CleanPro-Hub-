"use client";

import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { LogIn, LogOut, MapPin, Loader2, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { formatDateTime, formatDuration } from "@/lib/utils/format";
import type { ApiResponse } from "@/types/api";
import type { TimeEntryWithDetails } from "@/lib/time-entries/queries";

interface TodayJob {
  id: string;
  title: string;
}

interface CheckInCardProps {
  employeeId: string;
}

function useElapsed(checkIn: Date | null): string {
  const [elapsed, setElapsed] = useState("");

  useEffect(() => {
    if (!checkIn) { setElapsed(""); return; }
    const tick = () => {
      const mins = Math.floor((Date.now() - checkIn.getTime()) / 60000);
      setElapsed(formatDuration(mins));
    };
    tick();
    const id = setInterval(tick, 60000);
    return () => clearInterval(id);
  }, [checkIn]);

  return elapsed;
}

export function CheckInCard({ employeeId }: CheckInCardProps) {
  const queryClient = useQueryClient();
  const [selectedJobId, setSelectedJobId] = useState<string>("");
  const [gpsLoading, setGpsLoading] = useState(false);

  const { data: activeEntry, isLoading } = useQuery<TimeEntryWithDetails | null>({
    queryKey: ["active-entry", employeeId],
    queryFn: async () => {
      const res = await fetch(`/api/time-entries?employeeId=${employeeId}&activeOnly=true&limit=1`);
      const json = (await res.json()) as ApiResponse<{ entries: TimeEntryWithDetails[] }>;
      if (!json.ok) throw new Error(json.error.message);
      return json.data.entries[0] ?? null;
    },
    refetchInterval: 60000,
  });

  const { data: todayJobs } = useQuery<TodayJob[]>({
    queryKey: ["today-jobs", employeeId],
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];
      const res = await fetch(`/api/jobs?employeeId=${employeeId}&from=${today}&to=${today}&limit=20`);
      const json = (await res.json()) as ApiResponse<{ jobs: TodayJob[] }>;
      if (!json.ok) return [];
      return json.data.jobs;
    },
  });

  const elapsed = useElapsed(activeEntry ? new Date(activeEntry.checkIn) : null);

  const getGps = useCallback((): Promise<string | undefined> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) { resolve(undefined); return; }
      setGpsLoading(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setGpsLoading(false);
          resolve(`${pos.coords.latitude.toFixed(6)},${pos.coords.longitude.toFixed(6)}`);
        },
        () => { setGpsLoading(false); resolve(undefined); },
        { timeout: 8000 }
      );
    });
  }, []);

  const checkInMutation = useMutation({
    mutationKey: ["time-entries", "check-in", employeeId],
    mutationFn: async () => {
      const latLng = await getGps();
      const res = await fetch("/api/time-entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId,
          jobId: selectedJobId || undefined,
          latLng,
        }),
      });
      const json = (await res.json()) as ApiResponse<TimeEntryWithDetails>;
      if (!json.ok) throw new Error(json.error.message);
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["active-entry", employeeId] });
      queryClient.invalidateQueries({ queryKey: ["hours-summary", employeeId] });
      queryClient.invalidateQueries({ queryKey: ["time-entries"] });
      toast.success("Erfolgreich eingecheckt.");
    },
    onError: (err: Error) => {
      toast.error("Fehler beim Einchecken.", { description: err.message });
    },
  });

  const checkOutMutation = useMutation({
    mutationKey: ["time-entries", "check-out", employeeId],
    mutationFn: async (entryId: string) => {
      const res = await fetch(`/api/time-entries/${entryId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const json = (await res.json()) as ApiResponse<TimeEntryWithDetails>;
      if (!json.ok) throw new Error(json.error.message);
      return json.data;
    },
    onSuccess: (entry) => {
      queryClient.invalidateQueries({ queryKey: ["active-entry", employeeId] });
      queryClient.invalidateQueries({ queryKey: ["hours-summary", employeeId] });
      queryClient.invalidateQueries({ queryKey: ["time-entries"] });
      toast.success(`Ausgecheckt. Dauer: ${formatDuration(entry.durationMin ?? 0)}`);
    },
    onError: (err: Error) => {
      toast.error("Fehler beim Auschecken.", { description: err.message });
    },
  });

  if (isLoading) {
    return (
      <div className="rounded-xl border border-border/60 bg-card p-6 shadow-elevated space-y-4">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-10 w-36" />
      </div>
    );
  }

  const isPending = checkInMutation.isPending || checkOutMutation.isPending || gpsLoading;
  const checkedIn = !!activeEntry;

  return (
    <div className={cn(
      "rounded-xl border p-6 shadow-elevated transition-colors duration-300",
      checkedIn
        ? "border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/30"
        : "border-border/60 bg-card"
    )}>
      <div className="flex items-start justify-between mb-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
            Status
          </p>
          <div className="flex items-center gap-2">
            <span className={cn(
              "h-2.5 w-2.5 rounded-full",
              checkedIn ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground/40"
            )} />
            <p className="text-lg font-bold">
              {checkedIn ? "Eingecheckt" : "Nicht aktiv"}
            </p>
          </div>
        </div>
        {checkedIn && (
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Seit {formatDateTime(activeEntry.checkIn)}</p>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">{elapsed}</p>
            {activeEntry.latLng && (
              <p className="text-xs text-muted-foreground flex items-center gap-1 justify-end mt-0.5">
                <MapPin className="h-3 w-3" />
                GPS erfasst
              </p>
            )}
            {activeEntry.job && (
              <p className="text-xs text-muted-foreground flex items-center gap-1 justify-end mt-0.5">
                <Briefcase className="h-3 w-3" />
                {activeEntry.job.title}
              </p>
            )}
          </div>
        )}
      </div>

      {!checkedIn && (todayJobs?.length ?? 0) > 0 && (
        <div className="mb-4">
          <Select value={selectedJobId} onValueChange={setSelectedJobId}>
            <SelectTrigger>
              <SelectValue placeholder="Auftrag zuordnen (optional)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Kein Auftrag</SelectItem>
              {(todayJobs ?? []).map((j) => (
                <SelectItem key={j.id} value={j.id}>{j.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="flex gap-3">
        {!checkedIn ? (
          <Button
            onClick={() => checkInMutation.mutate()}
            disabled={isPending}
            className="bg-brand-500 hover:bg-brand-600 font-semibold"
          >
            {isPending ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{gpsLoading ? "GPS …" : "Laden …"}</>
            ) : (
              <><LogIn className="mr-2 h-4 w-4" />Einstempeln</>
            )}
          </Button>
        ) : (
          <Button
            variant="outline"
            onClick={() => checkOutMutation.mutate(activeEntry.id)}
            disabled={isPending}
            className="border-emerald-300 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-700 dark:text-emerald-400 dark:hover:bg-emerald-900/30 font-semibold"
          >
            {isPending ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Laden …</>
            ) : (
              <><LogOut className="mr-2 h-4 w-4" />Ausstempeln</>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
