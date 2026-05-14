"use client";

import { CheckCircle2, XCircle, Loader2, Wrench } from "lucide-react";
import type { ToolCallState } from "@/types/agent";

const TOOL_LABELS: Record<string, string> = {
  listCustomers: "Kunden abrufen",
  createCustomer: "Kunden anlegen",
  updateCustomer: "Kunden aktualisieren",
  listEmployees: "Mitarbeiter abrufen",
  createEmployee: "Mitarbeiter anlegen",
  scheduleJob: "Auftrag planen",
  getEmployeeHours: "Stunden abrufen",
  generateMonthlyReport: "Monatsbericht erstellen",
  findAvailableEmployee: "Verfügbare Mitarbeiter suchen",
};

interface Props {
  toolCall: ToolCallState;
}

export function ToolCallCard({ toolCall }: Props) {
  const label = TOOL_LABELS[toolCall.toolName] ?? toolCall.toolName;

  return (
    <div className="my-1 flex items-center gap-2 rounded-lg border border-border/60 bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
      <Wrench className="h-3.5 w-3.5 shrink-0 text-brand-400" />
      <span className="flex-1 font-medium">{label}</span>
      {toolCall.status === "loading" && (
        <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-brand-400" />
      )}
      {toolCall.status === "done" && (
        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
      )}
      {toolCall.status === "error" && (
        <XCircle className="h-3.5 w-3.5 shrink-0 text-destructive" />
      )}
    </div>
  );
}
