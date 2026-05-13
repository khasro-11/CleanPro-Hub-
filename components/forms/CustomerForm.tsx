"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { CustomerFormFields } from "./CustomerFormFields";
import { customerFormSchema, type CustomerFormInput } from "@/types/customer.schema";
import type { ApiResponse } from "@/types/api";
import type { Customer } from "@prisma/client";

interface CustomerFormProps {
  mode: "create" | "edit";
  customerId?: string;
  defaultValues?: Partial<CustomerFormInput>;
}

export function CustomerForm({ mode, customerId, defaultValues }: CustomerFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const form = useForm<CustomerFormInput>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: {
      name: "",
      company: "",
      street: "",
      zip: "",
      city: "",
      phone: "",
      email: "",
      notes: "",
      status: "AKTIV",
      ...defaultValues,
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: CustomerFormInput) => {
      const url = mode === "create" ? "/api/customers" : `/api/customers/${customerId}`;
      const method = mode === "create" ? "POST" : "PATCH";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = (await res.json()) as ApiResponse<Customer>;

      if (!json.ok) throw new Error(json.error.message);
      return json.data;
    },
    onSuccess: (customer) => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      if (mode === "create") {
        toast.success("Kunde erfolgreich angelegt.");
        router.push(`/kunden/${customer.id}`);
      } else {
        toast.success("Kunde erfolgreich aktualisiert.");
        router.push(`/kunden/${customer.id}`);
      }
    },
    onError: (err: Error) => {
      toast.error(mode === "create" ? "Fehler beim Anlegen." : "Fehler beim Aktualisieren.", {
        description: err.message,
      });
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((d) => mutation.mutate(d))} className="space-y-8">
        <CustomerFormFields form={form} showStatus={mode === "edit"} />

        <div className="flex items-center justify-end gap-3 border-t border-border pt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={mutation.isPending}
          >
            Abbrechen
          </Button>
          <Button
            type="submit"
            className="bg-brand-500 hover:bg-brand-600 min-w-28"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Speichern …</>
            ) : mode === "create" ? (
              "Kunden anlegen"
            ) : (
              "Änderungen speichern"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
