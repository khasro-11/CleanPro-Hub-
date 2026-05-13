import type { Metadata } from "next";

export const metadata: Metadata = { title: "Einstellungen" };

export default function EinstellungenPage() {
  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-bold tracking-tight">Einstellungen</h1>
      <p className="mt-2 text-muted-foreground">Einstellungen — wird in Phase 8 ausgebaut.</p>
    </div>
  );
}
