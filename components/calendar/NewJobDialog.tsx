"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { z } from "zod";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";

const schema = z.object({
  title: z.string().min(2, "Mindestens 2 Zeichen."),
  customerId: z.string().min(1, "Bitte einen Kunden auswählen."),
  scheduledAt: z.string().min(1, "Bitte Datum und Uhrzeit angeben."),
  duration: z.coerce.number().int().min(15, "Mindestens 15 Minuten.").max(480, "Maximal 8 Stunden."),
});
type FormData = z.infer<typeof schema>;

interface CustomerOption { id: string; name: string; company?: string | null }

interface NewJobDialogProps {
  open: boolean;
  prefillDateTime: string;
  onClose: () => void;
}

export function NewJobDialog({ open, prefillDateTime, onClose }: NewJobDialogProps) {
  const queryClient = useQueryClient();

  // Always enabled so data is ready before dialog opens
  const { data: customersData, isLoading: loadingCustomers } = useQuery<{ customers: CustomerOption[] }>({
    queryKey: ["customers-for-dialog"],
    queryFn: async () => {
      const res = await fetch("/api/customers?limit=100");
      const json = await res.json() as { ok: boolean; data: { customers: CustomerOption[] } };
      if (!json.ok) throw new Error("Fehler");
      return json.data;
    },
    staleTime: 5 * 60_000,
  });

  const customers = customersData?.customers ?? [];

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { title: "", customerId: "", scheduledAt: prefillDateTime, duration: 60 },
  });

  // Sync pre-filled date whenever dialog opens
  useEffect(() => {
    if (open) {
      form.reset({ title: "", customerId: "", scheduledAt: prefillDateTime, duration: 60 });
    }
  }, [open, prefillDateTime, form]);

  async function onSubmit(data: FormData) {
    const res = await fetch("/api/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...data,
        recurrence: "EINMALIG",
        status: "GEPLANT",
        employeeIds: [],
      }),
    });
    const json = await res.json() as { ok: boolean; error?: { message: string } };
    if (!json.ok) {
      toast.error(json.error?.message ?? "Fehler beim Erstellen.");
      return;
    }
    toast.success("Auftrag erstellt.");
    await queryClient.invalidateQueries({ queryKey: ["calendar-jobs"] });
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Neuen Auftrag anlegen</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Titel */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Titel</FormLabel>
                  <FormControl>
                    <Input placeholder="Auftragstitel" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Kunde */}
            <FormField
              control={form.control}
              name="customerId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kunde</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger disabled={loadingCustomers}>
                        <SelectValue placeholder={loadingCustomers ? "Laden…" : "Kunden auswählen…"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {customers.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}{c.company ? ` – ${c.company}` : ""}
                        </SelectItem>
                      ))}
                      {customers.length === 0 && !loadingCustomers && (
                        <div className="px-2 py-1.5 text-sm text-muted-foreground">
                          Keine Kunden gefunden.
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Datum & Dauer */}
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="scheduledAt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Datum & Uhrzeit</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="duration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dauer (Min.)</FormLabel>
                    <FormControl>
                      <Input type="number" min={15} step={15} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Abbrechen
              </Button>
              <Button
                type="submit"
                disabled={form.formState.isSubmitting}
                className="bg-brand-500 hover:bg-brand-600"
              >
                {form.formState.isSubmitting ? "Erstellen…" : "Erstellen"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
