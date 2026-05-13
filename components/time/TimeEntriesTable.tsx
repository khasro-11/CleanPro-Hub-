"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ChevronLeft, ChevronRight, Search, X, Download, Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { formatDateTime, formatDuration } from "@/lib/utils/format";
import type { ApiResponse } from "@/types/api";
import type { TimeEntryWithDetails } from "@/lib/time-entries/queries";

interface ListResponse {
  entries: TimeEntryWithDetails[];
  total: number;
  page: number;
  limit: number;
}

interface TimeEntriesTableProps {
  isAdmin: boolean;
  employeeId?: string;
}

export function TimeEntriesTable({ isAdmin, employeeId }: TimeEntriesTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const page = Number(params.get("page") ?? 1);
  const from = params.get("from") ?? "";
  const to = params.get("to") ?? "";

  const update = useCallback(
    (key: string, value: string) => {
      const next = new URLSearchParams(params.toString());
      if (value) next.set(key, value); else next.delete(key);
      next.delete("page");
      router.replace(`${pathname}?${next.toString()}`);
    },
    [params, pathname, router]
  );

  const hasFilters = from || to;

  const qp = new URLSearchParams(params.toString());
  if (employeeId) qp.set("employeeId", employeeId);

  const { data, isLoading } = useQuery<ListResponse>({
    queryKey: ["time-entries", qp.toString()],
    queryFn: async () => {
      const res = await fetch(`/api/time-entries?${qp.toString()}`);
      const json = (await res.json()) as ApiResponse<ListResponse>;
      if (!json.ok) throw new Error("Fehler beim Laden.");
      return json.data;
    },
  });

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    next.set(key, value);
    router.replace(`${pathname}?${next.toString()}`);
  }

  function exportCsv() {
    const ep = new URLSearchParams();
    if (employeeId) ep.set("employeeId", employeeId);
    if (from) ep.set("from", from);
    if (to) ep.set("to", to);
    window.open(`/api/time-entries/export?${ep.toString()}`, "_blank");
  }

  if (isLoading) return <TableSkeleton />;

  const entries = data?.entries ?? [];
  const total = data?.total ?? 0;
  const limit = data?.limit ?? 25;
  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <Search className="h-4 w-4 text-muted-foreground shrink-0" />
        <div className="flex items-center gap-2">
          <Input
            type="date"
            className="w-38"
            value={from}
            onChange={(e) => update("from", e.target.value)}
            title="Von Datum"
          />
          <span className="text-muted-foreground text-sm">–</span>
          <Input
            type="date"
            className="w-38"
            value={to}
            onChange={(e) => update("to", e.target.value)}
            title="Bis Datum"
          />
        </div>
        {hasFilters && (
          <Button
            variant="ghost" size="sm"
            onClick={() => { update("from", ""); update("to", ""); }}
            className="text-muted-foreground"
          >
            <X className="mr-1.5 h-3.5 w-3.5" />
            Zurücksetzen
          </Button>
        )}
        {isAdmin && (
          <Button variant="outline" size="sm" onClick={exportCsv} className="ml-auto">
            <Download className="mr-1.5 h-4 w-4" />
            CSV-Export
          </Button>
        )}
      </div>

      {entries.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16 text-center">
          <Clock className="mb-3 h-10 w-10 text-muted-foreground/40" />
          <h3 className="text-sm font-semibold">Keine Einträge gefunden</h3>
          <p className="mt-1 text-xs text-muted-foreground">Passen Sie die Datumsfilter an.</p>
        </div>
      ) : (
        <div className="rounded-lg border border-border/60 shadow-elevated overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                {isAdmin && <TableHead className="font-semibold">Mitarbeiter</TableHead>}
                <TableHead className="font-semibold">Einstempeln</TableHead>
                <TableHead className="font-semibold">Ausstempeln</TableHead>
                <TableHead className="font-semibold">Dauer</TableHead>
                <TableHead className="hidden md:table-cell font-semibold">Auftrag</TableHead>
                <TableHead className="hidden lg:table-cell font-semibold">GPS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((entry) => (
                <TableRow key={entry.id}>
                  {isAdmin && (
                    <TableCell className="font-medium text-sm">
                      {entry.employee.firstName} {entry.employee.lastName}
                    </TableCell>
                  )}
                  <TableCell className="text-sm">{formatDateTime(entry.checkIn)}</TableCell>
                  <TableCell className="text-sm">
                    {entry.checkOut ? formatDateTime(entry.checkOut) : (
                      <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-xs font-medium">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Aktiv
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">
                    {entry.durationMin != null
                      ? formatDuration(entry.durationMin)
                      : <span className="text-muted-foreground">–</span>}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                    {entry.job?.title ?? "–"}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">
                    {entry.latLng ?? "–"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-1">
          <p className="text-sm text-muted-foreground">
            {total} Einträge · Seite {page} von {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline" size="sm"
              disabled={page <= 1}
              onClick={() => setParam("page", String(page - 1))}
            >
              <ChevronLeft className="h-4 w-4" /> Zurück
            </Button>
            <Button
              variant="outline" size="sm"
              disabled={page >= totalPages}
              onClick={() => setParam("page", String(page + 1))}
            >
              Weiter <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <Skeleton className="h-9 w-36" />
        <Skeleton className="h-9 w-36" />
      </div>
      <div className="rounded-lg border border-border/60 shadow-elevated overflow-hidden">
        <div className="p-4 border-b bg-muted/30">
          <Skeleton className="h-5 w-48" />
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 border-b px-4 py-3.5">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-24 hidden md:block" />
          </div>
        ))}
      </div>
    </div>
  );
}
