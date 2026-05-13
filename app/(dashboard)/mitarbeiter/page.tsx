import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmployeesTable } from "@/components/tables/EmployeesTable";
import { EmployeesTableFilters } from "@/components/tables/EmployeesTableFilters";
import { requireAuth } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Mitarbeiter" };

export default async function MitarbeiterPage() {
  const session = await requireAuth();
  const isAdmin = session.user.role === "ADMIN";

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Mitarbeiter</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Verwalten Sie Ihr Team und deren Einsätze.
          </p>
        </div>
        {isAdmin && (
          <Button asChild className="bg-brand-500 hover:bg-brand-600 shadow-brand-sm shrink-0">
            <Link href="/mitarbeiter/neu">
              <Plus className="mr-2 h-4 w-4" />
              Neuer Mitarbeiter
            </Link>
          </Button>
        )}
      </div>

      <Suspense fallback={<Skeleton className="h-10 w-full max-w-sm" />}>
        <EmployeesTableFilters />
      </Suspense>

      <Suspense fallback={<ListSkeleton />}>
        <EmployeesTable />
      </Suspense>
    </div>
  );
}

function ListSkeleton() {
  return (
    <div className="rounded-lg border border-border/60 shadow-elevated overflow-hidden">
      <div className="p-4 border-b bg-muted/30"><Skeleton className="h-5 w-48" /></div>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 border-b px-4 py-3.5">
          <Skeleton className="h-8 w-8 rounded-full shrink-0" />
          <div className="space-y-1.5 flex-1"><Skeleton className="h-4 w-36" /><Skeleton className="h-3 w-24" /></div>
          <Skeleton className="h-5 w-16" />
        </div>
      ))}
    </div>
  );
}
