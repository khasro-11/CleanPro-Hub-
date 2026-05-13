import type { Metadata } from "next";

export const metadata: Metadata = { title: "Berichte" };

export default function BerichtePage() {
  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-bold tracking-tight">Berichte</h1>
      <p className="mt-2 text-muted-foreground">Berichte & Auswertungen — wird in Phase 6 ausgebaut.</p>
    </div>
  );
}
