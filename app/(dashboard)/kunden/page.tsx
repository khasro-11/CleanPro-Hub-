import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CustomersTable } from "@/components/tables/CustomersTable";
import { CustomersTableFilters } from "@/components/tables/CustomersTableFilters";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = { title: "Kunden" };

export default function KundenPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Kunden</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Verwalten Sie Ihre Kunden und Verträge.
          </p>
        </div>
        <Button asChild className="bg-brand-500 hover:bg-brand-600 shadow-brand-sm shrink-0">
          <Link href="/kunden/neu">
            <Plus className="mr-2 h-4 w-4" />
            Neuer Kunde
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <Suspense fallback={<Skeleton className="h-10 w-full max-w-sm" />}>
        <CustomersTableFilters />
      </Suspense>

      {/* Table */}
      <Suspense fallback={<TableSkeleton />}>
        <CustomersTable />
      </Suspense>
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="rounded-lg border border-border/60 shadow-elevated overflow-hidden">
      <div className="p-4 border-b bg-muted/30">
        <Skeleton className="h-5 w-48" />
      </div>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 border-b px-4 py-3.5">
          <div className="space-y-1.5 flex-1">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-4 w-14" />
        </div>
      ))}
    </div>
  );
}
