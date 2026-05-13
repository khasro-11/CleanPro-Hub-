import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { JobsTable } from "@/components/tables/JobsTable";
import { JobsTableFilters } from "@/components/tables/JobsTableFilters";
import { requireAuth } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Aufträge" };

export default async function AuftraegePage() {
  const session = await requireAuth();
  const isAdmin = session.user.role === "ADMIN";

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Aufträge</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Übersicht aller Reinigungsaufträge.
          </p>
        </div>
        {isAdmin && (
          <Button asChild className="bg-brand-500 hover:bg-brand-600 shadow-brand-sm shrink-0">
            <Link href="/auftraege/neu">
              <Plus className="mr-2 h-4 w-4" />
              Neuer Auftrag
            </Link>
          </Button>
        )}
      </div>

      <Suspense fallback={<Skeleton className="h-10 w-full max-w-2xl" />}>
        <JobsTableFilters />
      </Suspense>

      <Suspense fallback={<TableSkeleton />}>
        <JobsTable />
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
