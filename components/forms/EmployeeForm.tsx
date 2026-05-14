"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { EmployeeFormFields } from "./EmployeeFormFields";
import { employeeFormSchema, type EmployeeFormInput } from "@/types/employee.schema";
import type { ApiResponse } from "@/types/api";
import type { Employee } from "@prisma/client";

interface EmployeeFormProps {
  mode: "create" | "edit";
  employeeId?: string;
  defaultValues?: Partial<EmployeeFormInput>;
}

export function EmployeeForm({ mode, employeeId, defaultValues }: EmployeeFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";

  const form = useForm<EmployeeFormInput>({
    resolver: zodResolver(employeeFormSchema),
    defaultValues: {
      firstName: "", lastName: "", email: "", phone: "",
      street: "", zip: "", city: "",
      birthDate: "", startDate: "",
      hourlyWage: "", weeklyHours: "",
      taxId: "", svNumber: "",
      contractType: "VOLLZEIT",
      status: "AKTIV",
      ...defaultValues,
    },
  });

  const mutation = useMutation({
    mutationKey: ["employees", mode, employeeId],
    mutationFn: async (data: EmployeeFormInput) => {
      const url = mode === "create" ? "/api/employees" : `/api/employees/${employeeId}`;
      const method = mode === "create" ? "POST" : "PATCH";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = (await res.json()) as ApiResponse<Employee>;
      if (!json.ok) throw new Error(json.error.message);
      return json.data;
    },
    onSuccess: (employee) => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      if (mode === "create") {
        toast.success("Mitarbeiter erfolgreich angelegt.");
        router.push(`/mitarbeiter/${employee.id}`);
      } else {
        toast.success("Mitarbeiter erfolgreich aktualisiert.");
        router.push(`/mitarbeiter/${employee.id}`);
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
        <EmployeeFormFields form={form} isAdmin={isAdmin} />

        <div className="flex items-center justify-end gap-3 border-t border-border pt-6">
          <Button type="button" variant="outline" onClick={() => router.back()} disabled={mutation.isPending}>
            Abbrechen
          </Button>
          <Button type="submit" className="bg-brand-500 hover:bg-brand-600 min-w-36" disabled={mutation.isPending}>
            {mutation.isPending ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Speichern …</>
            ) : mode === "create" ? (
              "Mitarbeiter anlegen"
            ) : (
              "Änderungen speichern"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
