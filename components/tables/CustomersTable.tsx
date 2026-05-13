"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight, Building2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { formatDate, formatCurrency } from "@/lib/utils/format";
import {
  CUSTOMER_TYPE_LABELS, CONTRACT_TYPE_LABELS, CUSTOMER_STATUS_LABELS,
} from "@/lib/utils/labels";
import type { CustomerWithJobCount } from "@/lib/customers/queries";
import { CustomerStatus } from "@prisma/client";

const STATUS_VARIANTS: Record<CustomerStatus, "default" | "secondary" | "outline"> = {
  AKTIV: "default",
  INAKTIV: "secondary",
  ARCHIVIERT: "outline",
};

type SortKey = "name" | "createdAt" | "status" | "customerType";

function SortIcon({ col, current, order }: { col: SortKey; current: SortKey; order: string }) {
  if (col !== current) return <ArrowUpDown className="ml-1.5 h-3.5 w-3.5 text-muted-foreground/60" />;
  return order === "asc"
    ? <ArrowUp className="ml-1.5 h-3.5 w-3.5 text-brand-500" />
    : <ArrowDown className="ml-1.5 h-3.5 w-3.5 text-brand-500" />;
}

interface ListResponse {
  customers: (CustomerWithJobCount & { id: string })[];
  total: number;
  page: number;
  limit: number;
}

export function CustomersTable() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const page = Number(params.get("page") ?? 1);
  const sortBy = (params.get("sortBy") ?? "createdAt") as SortKey;
  const sortOrder = params.get("sortOrder") ?? "desc";

  const qp = params.toString();
  const { data, isLoading } = useQuery<ListResponse>({
    queryKey: ["customers", qp],
    queryFn: async () => {
      const res = await fetch(`/api/customers?${qp}`);
      const json = (await res.json()) as { ok: boolean; data: ListResponse };
      if (!json.ok) throw new Error("Fehler beim Laden der Kunden.");
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

  const customers = data?.customers ?? [];
  const total = data?.total ?? 0;
  const limit = data?.limit ?? 20;
  const totalPages = Math.ceil(total / limit);

  if (customers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-20 text-center">
        <Building2 className="mb-4 h-12 w-12 text-muted-foreground/40" />
        <h3 className="text-base font-semibold">Keine Kunden gefunden</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Passen Sie Ihre Filter an oder legen Sie einen neuen Kunden an.
        </p>
        <Button asChild className="mt-5 bg-brand-500 hover:bg-brand-600">
          <Link href="/kunden/neu">Kunden anlegen</Link>
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
                <button className="flex items-center font-semibold" onClick={() => toggleSort("name")}>
                  Name <SortIcon col="name" current={sortBy} order={sortOrder} />
                </button>
              </TableHead>
              <TableHead>
                <button className="flex items-center font-semibold" onClick={() => toggleSort("customerType")}>
                  Typ <SortIcon col="customerType" current={sortBy} order={sortOrder} />
                </button>
              </TableHead>
              <TableHead className="hidden md:table-cell">Vertrag</TableHead>
              <TableHead className="hidden lg:table-cell">Preis</TableHead>
              <TableHead>
                <button className="flex items-center font-semibold" onClick={() => toggleSort("status")}>
                  Status <SortIcon col="status" current={sortBy} order={sortOrder} />
                </button>
              </TableHead>
              <TableHead className="hidden sm:table-cell">
                <button className="flex items-center font-semibold" onClick={() => toggleSort("createdAt")}>
                  Angelegt <SortIcon col="createdAt" current={sortBy} order={sortOrder} />
                </button>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.map((c) => (
              <TableRow key={c.id} className="cursor-pointer hover:bg-muted/30" onClick={() => router.push(`/kunden/${c.id}`)}>
                <TableCell>
                  <div>
                    <p className="font-medium text-foreground">{c.name}</p>
                    {c.company && <p className="text-xs text-muted-foreground">{c.company}</p>}
                    <p className="text-xs text-muted-foreground">{c.zip} {c.city}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className="font-normal">
                    {CUSTOMER_TYPE_LABELS[c.customerType]}
                  </Badge>
                </TableCell>
                <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                  {CONTRACT_TYPE_LABELS[c.contractType]}
                </TableCell>
                <TableCell className="hidden lg:table-cell text-sm">
                  {c.flatRate
                    ? formatCurrency(Number(c.flatRate))
                    : c.hourlyRate
                    ? `${formatCurrency(Number(c.hourlyRate))}/Std.`
                    : "–"}
                </TableCell>
                <TableCell>
                  <Badge variant={STATUS_VARIANTS[c.status]}>
                    {CUSTOMER_STATUS_LABELS[c.status]}
                  </Badge>
                </TableCell>
                <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                  {formatDate(c.createdAt)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-1">
          <p className="text-sm text-muted-foreground">
            {total} Kunden · Seite {page} von {totalPages}
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
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-5 w-24 hidden md:block" />
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-4 w-20 hidden sm:block" />
        </div>
      ))}
    </div>
  );
}
