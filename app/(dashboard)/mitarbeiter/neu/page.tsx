import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmployeeForm } from "@/components/forms/EmployeeForm";
import { requireAdmin } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Neuer Mitarbeiter" };

export default async function NeuerMitarbeiterPage() {
  await requireAdmin();

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm" className="text-muted-foreground">
          <Link href="/mitarbeiter">
            <ChevronLeft className="mr-1 h-4 w-4" />
            Mitarbeiter
          </Link>
        </Button>
      </div>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">Neuer Mitarbeiter</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Füllen Sie die Pflichtfelder aus, um einen Mitarbeiter anzulegen.
        </p>
      </div>

      <div className="rounded-xl border border-border/60 bg-card p-6 shadow-elevated">
        <EmployeeForm mode="create" />
      </div>
    </div>
  );
}
