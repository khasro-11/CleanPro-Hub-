import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CustomerForm } from "@/components/forms/CustomerForm";
import { requireAdmin } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Neuer Kunde" };

export default async function NeuerKundePage() {
  await requireAdmin();

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm" className="text-muted-foreground">
          <Link href="/kunden">
            <ChevronLeft className="mr-1 h-4 w-4" />
            Kunden
          </Link>
        </Button>
      </div>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">Neuer Kunde</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Füllen Sie alle Pflichtfelder aus, um einen Kunden anzulegen.
        </p>
      </div>

      <div className="rounded-xl border border-border/60 bg-card p-6 shadow-elevated">
        <CustomerForm mode="create" />
      </div>
    </div>
  );
}
