"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight, UserCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate, formatInitials } from "@/lib/utils/format";

import { EMPLOYEE_STATUS_LABELS, EMPLOYEE_CONTRACT_TYPE_LABELS } from "@/lib/utils/labels";
import { EmployeeStatus } from "@prisma/client";

type SortKey = "lastName" | "createdAt" | "status" | "startDate";

const STATUS_VARIANTS: Record<EmployeeStatus, "default" | "secondary" | "outline" | "destructive"> = {
  AKTIV: "default",
  KRANK: "secondary",
  URLAUB: "secondary",
  INAKTIV: "outline",
};

const STATUS_COLORS: Record<EmployeeStatus, string> = {
  AKTIV: "bg-emerald-500",
  KRANK: "bg-amber-500",
  URLAUB: "bg-brand-500",
  INAKTIV: "bg-muted-foreground",
};

interface EmployeeRow {
  id: string; firstName: string; lastName: string; photoUrl?: string | null;
  email?: string | null; contractType: string; status: EmployeeStatus;
  weeklyHours?: number | null; startDate?: string | null; createdAt: string;
  _count: { jobAssignments: number; timeEntries: number };
}
interface ListResponse { employees: EmployeeRow[]; total: number; page: number; limit: number }

function SortIcon({ col, current, order }: { col: SortKey; current: SortKey; order: string }) {
  if (col !== current) return <ArrowUpDown className="ml-1.5 h-3.5 w-3.5 text-muted-foreground/60" />;
  return order === "asc"
    ? <ArrowUp className="ml-1.5 h-3.5 w-3.5 text-brand-500" />
    : <ArrowDown className="ml-1.5 h-3.5 w-3.5 text-brand-500" />;
}

export function EmployeesTable() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const page = Number(params.get("page") ?? 1);
  const sortBy = (params.get("sortBy") ?? "lastName") as SortKey;
  const sortOrder = params.get("sortOrder") ?? "asc";
  const qp = params.toString();

  const { data, isLoading } = useQuery<ListResponse>({
    queryKey: ["employees", qp],
    queryFn: async () => {
      const res = await fetch(`/api/employees?${qp}`);
      const json = (await res.json()) as { ok: boolean; data: ListResponse };
      if (!json.ok) throw new Error("Fehler beim Laden der Mitarbeiter.");
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
    if (sortBy === col) next.set("sortOrder", sortOrder === "asc" ? "desc" : "asc");
    else { next.set("sortBy", col); next.set("sortOrder", "asc"); }
    next.delete("page");
    router.replace(`${pathname}?${next.toString()}`);
  }

  if (isLoading) return <TableSkeleton />;

  const employees = data?.employees ?? [];
  const total = data?.total ?? 0;
  const limit = data?.limit ?? 20;
  const totalPages = Math.ceil(total / limit);

  if (employees.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-20 text-center">
        <UserCheck className="mb-4 h-12 w-12 text-muted-foreground/40" />
        <h3 className="text-base font-semibold">Keine Mitarbeiter gefunden</h3>
        <p className="mt-1 text-sm text-muted-foreground">Passen Sie Ihre Filter an oder legen Sie einen neuen Mitarbeiter an.</p>
        <Button asChild className="mt-5 bg-brand-500 hover:bg-brand-600">
          <Link href="/mitarbeiter/neu">Mitarbeiter anlegen</Link>
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
                <button className="flex items-center font-semibold" onClick={() => toggleSort("lastName")}>
                  Name <SortIcon col="lastName" current={sortBy} order={sortOrder} />
                </button>
              </TableHead>
              <TableHead className="hidden sm:table-cell">Vertragsart</TableHead>
              <TableHead className="hidden md:table-cell">Std./Woche</TableHead>
              <TableHead>
                <button className="flex items-center font-semibold" onClick={() => toggleSort("status")}>
                  Status <SortIcon col="status" current={sortBy} order={sortOrder} />
                </button>
              </TableHead>
              <TableHead className="hidden lg:table-cell">
                <button className="flex items-center font-semibold" onClick={() => toggleSort("startDate")}>
                  Eingetreten <SortIcon col="startDate" current={sortBy} order={sortOrder} />
                </button>
              </TableHead>
              <TableHead className="hidden lg:table-cell text-center">Aufträge</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {employees.map((e) => (
              <TableRow key={e.id} className="cursor-pointer hover:bg-muted/30" onClick={() => router.push(`/mitarbeiter/${e.id}`)}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8 shrink-0">
                      {e.photoUrl && <AvatarImage src={e.photoUrl} alt={`${e.firstName} ${e.lastName}`} />}
                      <AvatarFallback className="bg-brand-500/10 text-brand-600 text-xs font-semibold">
                        {formatInitials(e.firstName, e.lastName)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{e.firstName} {e.lastName}</p>
                      {e.email && <p className="text-xs text-muted-foreground">{e.email}</p>}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                  {EMPLOYEE_CONTRACT_TYPE_LABELS[e.contractType as keyof typeof EMPLOYEE_CONTRACT_TYPE_LABELS]}
                </TableCell>
                <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                  {e.weeklyHours ? `${e.weeklyHours} Std.` : "–"}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className={`h-1.5 w-1.5 rounded-full ${STATUS_COLORS[e.status]}`} />
                    <Badge variant={STATUS_VARIANTS[e.status]}>
                      {EMPLOYEE_STATUS_LABELS[e.status]}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                  {e.startDate ? formatDate(e.startDate) : "–"}
                </TableCell>
                <TableCell className="hidden lg:table-cell text-center text-sm text-muted-foreground">
                  {e._count.jobAssignments}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-1">
          <p className="text-sm text-muted-foreground">{total} Mitarbeiter · Seite {page} von {totalPages}</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setParam("page", String(page - 1))}>
              <ChevronLeft className="h-4 w-4" /> Zurück
            </Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setParam("page", String(page + 1))}>
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
      <div className="p-4 border-b bg-muted/30"><Skeleton className="h-5 w-48" /></div>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 border-b px-4 py-3.5">
          <Skeleton className="h-8 w-8 rounded-full shrink-0" />
          <div className="space-y-1.5 flex-1">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-5 w-20 hidden sm:block" />
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-4 w-20 hidden lg:block" />
        </div>
      ))}
    </div>
  );
}
