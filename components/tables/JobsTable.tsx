"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { formatDateTime, formatDuration } from "@/lib/utils/format";
import { JOB_STATUS_LABELS, JOB_STATUS_COLORS, RECURRENCE_TYPE_LABELS } from "@/lib/utils/labels";
import type { JobWithDetails } from "@/lib/jobs/queries";

type SortKey = "scheduledAt" | "createdAt" | "status" | "title";

function SortIcon({ col, current, order }: { col: SortKey; current: SortKey; order: string }) {
  if (col !== current) return <ArrowUpDown className="ml-1.5 h-3.5 w-3.5 text-muted-foreground/60" />;
  return order === "asc"
    ? <ArrowUp className="ml-1.5 h-3.5 w-3.5 text-brand-500" />
    : <ArrowDown className="ml-1.5 h-3.5 w-3.5 text-brand-500" />;
}

interface ListResponse {
  jobs: JobWithDetails[];
  total: number;
  page: number;
  limit: number;
}

export function JobsTable() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const page = Number(params.get("page") ?? 1);
  const sortBy = (params.get("sortBy") ?? "scheduledAt") as SortKey;
  const sortOrder = params.get("sortOrder") ?? "asc";

  const qp = params.toString();
  const { data, isLoading } = useQuery<ListResponse>({
    queryKey: ["jobs", qp],
    queryFn: async () => {
      const res = await fetch(`/api/jobs?${qp}`);
      const json = (await res.json()) as { ok: boolean; data: ListResponse };
      if (!json.ok) throw new Error("Fehler beim Laden der Aufträge.");
      return json.data;
    },
  });

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    next.set(key, value);
    router.replace(`${pathname}?${next.toString()}`);
  }

  function toggleSort(col: SortKey) {
    const next = new URLSearchParams(params.toString());
    if (sortBy === col) {
      next.set("sortOrder", sortOrder === "asc" ? "desc" : "asc");
    } else {
      next.set("sortBy", col);
      next.set("sortOrder", "asc");
    }
    next.delete("page");
    router.replace(`${pathname}?${next.toString()}`);
  }

  if (isLoading) return <TableSkeleton />;

  const jobs = data?.jobs ?? [];
  const total = data?.total ?? 0;
  const limit = data?.limit ?? 25;
  const totalPages = Math.ceil(total / limit);

  if (jobs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-20 text-center">
        <ClipboardList className="mb-4 h-12 w-12 text-muted-foreground/40" />
        <h3 className="text-base font-semibold">Keine Aufträge gefunden</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Passen Sie Ihre Filter an oder legen Sie einen neuen Auftrag an.
        </p>
        <Button asChild className="mt-5 bg-brand-500 hover:bg-brand-600">
          <Link href="/auftraege/neu">Auftrag anlegen</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border/60 shadow-elevated overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead>
                <button className="flex items-center font-semibold" onClick={() => toggleSort("title")}>
                  Auftrag <SortIcon col="title" current={sortBy} order={sortOrder} />
                </button>
              </TableHead>
              <TableHead className="hidden md:table-cell">Kunde</TableHead>
              <TableHead>
                <button className="flex items-center font-semibold" onClick={() => toggleSort("scheduledAt")}>
                  Termin <SortIcon col="scheduledAt" current={sortBy} order={sortOrder} />
                </button>
              </TableHead>
              <TableHead className="hidden lg:table-cell">Mitarbeiter</TableHead>
              <TableHead>
                <button className="flex items-center font-semibold" onClick={() => toggleSort("status")}>
                  Status <SortIcon col="status" current={sortBy} order={sortOrder} />
                </button>
              </TableHead>
              <TableHead className="hidden sm:table-cell">Wiederholung</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {jobs.map((job) => (
              <TableRow
                key={job.id}
                className="cursor-pointer hover:bg-muted/30"
                onClick={() => router.push(`/auftraege/${job.id}`)}
              >
                <TableCell>
                  <div>
                    <p className="font-medium text-foreground">{job.title}</p>
                    <p className="text-xs text-muted-foreground">{formatDuration(job.duration)}</p>
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                  <p>{job.customer.name}</p>
                  {job.customer.company && (
                    <p className="text-xs">{job.customer.company}</p>
                  )}
                </TableCell>
                <TableCell className="text-sm">
                  {formatDateTime(job.scheduledAt)}
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  {job.assignments.length === 0 ? (
                    <span className="text-xs text-muted-foreground">Nicht besetzt</span>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      {job.assignments.map((a) => `${a.employee.firstName} ${a.employee.lastName}`).join(", ")}
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${JOB_STATUS_COLORS[job.status]}`}>
                    {JOB_STATUS_LABELS[job.status]}
                  </span>
                </TableCell>
                <TableCell className="hidden sm:table-cell text-xs text-muted-foreground">
                  {RECURRENCE_TYPE_LABELS[job.recurrence]}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-1">
          <p className="text-sm text-muted-foreground">
            {total} Aufträge · Seite {page} von {totalPages}
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
    <div className="rounded-lg border border-border/60 shadow-elevated overflow-hidden">
      <div className="p-4 border-b bg-muted/30">
        <Skeleton className="h-5 w-48" />
      </div>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 border-b px-4 py-3.5">
          <div className="space-y-1.5 flex-1">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-20" />
          </div>
          <Skeleton className="h-4 w-28 hidden md:block" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-4 w-20 hidden sm:block" />
        </div>
      ))}
    </div>
  );
}
