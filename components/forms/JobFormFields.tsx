"use client";

import { useQuery } from "@tanstack/react-query";
import type { UseFormReturn } from "react-hook-form";
import {
  FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { RecurrenceType, JobStatus } from "@prisma/client";
import { RECURRENCE_TYPE_LABELS, JOB_STATUS_LABELS } from "@/lib/utils/labels";
import { EmployeeMultiSelect } from "./EmployeeMultiSelect";
import type { JobFormInput } from "@/types/job.schema";

interface CustomerOption { id: string; name: string; company?: string | null }

interface JobFormFieldsProps {
  form: UseFormReturn<JobFormInput>;
  showStatus?: boolean;
}

export function JobFormFields({ form, showStatus = false }: JobFormFieldsProps) {
  const { data: customers } = useQuery<{ customers: CustomerOption[] }>({
    queryKey: ["customers-select"],
    queryFn: async () => {
      const res = await fetch("/api/customers?status=AKTIV&limit=200&sortBy=name&sortOrder=asc");
      const json = (await res.json()) as { ok: boolean; data: { customers: CustomerOption[] } };
      if (!json.ok) throw new Error("Fehler beim Laden.");
      return json.data;
    },
  });

  return (
    <div className="space-y-6">
      {/* Core info */}
      <div>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Auftragsdaten</h3>
        <div className="space-y-4">
          <FormField control={form.control} name="title" render={({ field }) => (
            <FormItem>
              <FormLabel>Bezeichnung *</FormLabel>
              <FormControl><Input placeholder="Wöchentliche Büroreinigung" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={form.control} name="customerId" render={({ field }) => (
            <FormItem>
              <FormLabel>Kunde *</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger><SelectValue placeholder="Kunden auswählen" /></SelectTrigger>
                </FormControl>
                <SelectContent>
                  {(customers?.customers ?? []).map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}{c.company ? ` – ${c.company}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField control={form.control} name="scheduledAt" render={({ field }) => (
              <FormItem>
                <FormLabel>Datum & Uhrzeit *</FormLabel>
                <FormControl><Input type="datetime-local" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="duration" render={({ field }) => (
              <FormItem>
                <FormLabel>Dauer (Minuten) *</FormLabel>
                <FormControl><Input type="number" min={15} max={1440} placeholder="120" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField control={form.control} name="recurrence" render={({ field }) => (
              <FormItem>
                <FormLabel>Wiederholung</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {(Object.keys(RECURRENCE_TYPE_LABELS) as RecurrenceType[]).map((r) => (
                      <SelectItem key={r} value={r}>{RECURRENCE_TYPE_LABELS[r]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
            {showStatus && (
              <FormField control={form.control} name="status" render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {(Object.keys(JOB_STATUS_LABELS) as JobStatus[]).map((s) => (
                        <SelectItem key={s} value={s}>{JOB_STATUS_LABELS[s]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            )}
          </div>
        </div>
      </div>

      {/* Employees */}
      <div>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Mitarbeiter</h3>
        <FormField control={form.control} name="employeeIds" render={({ field }) => (
          <FormItem>
            <FormLabel>Zugewiesene Mitarbeiter</FormLabel>
            <FormControl>
              <EmployeeMultiSelect value={field.value ?? []} onChange={field.onChange} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />
      </div>

      {/* Notes */}
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField control={form.control} name="description" render={({ field }) => (
          <FormItem>
            <FormLabel>Beschreibung</FormLabel>
            <FormControl><Textarea placeholder="Aufgabenbeschreibung …" rows={3} {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="notes" render={({ field }) => (
          <FormItem>
            <FormLabel>Interne Notizen</FormLabel>
            <FormControl><Textarea placeholder="Zugangsdaten, Hinweise …" rows={3} {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
      </div>
    </div>
  );
}
