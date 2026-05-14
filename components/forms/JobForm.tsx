"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { JobFormFields } from "./JobFormFields";
import { jobFormSchema, type JobFormInput } from "@/types/job.schema";
import type { ApiResponse } from "@/types/api";
import type { Job } from "@prisma/client";

interface JobFormProps {
  mode: "create" | "edit";
  jobId?: string;
  defaultValues?: Partial<JobFormInput>;
}

export function JobForm({ mode, jobId, defaultValues }: JobFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const form = useForm<JobFormInput>({
    resolver: zodResolver(jobFormSchema),
    defaultValues: {
      title: "",
      customerId: "",
      scheduledAt: "",
      duration: 120,
      recurrence: "EINMALIG",
      employeeIds: [],
      description: "",
      notes: "",
      status: "GEPLANT",
      ...defaultValues,
    },
  });

  const mutation = useMutation({
    mutationKey: ["jobs", mode, jobId],
    mutationFn: async (data: JobFormInput) => {
      const url = mode === "create" ? "/api/jobs" : `/api/jobs/${jobId}`;
      const method = mode === "create" ? "POST" : "PATCH";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = (await res.json()) as ApiResponse<Job>;
      if (!json.ok) throw new Error(json.error.message);
      return json.data;
    },
    onSuccess: (job) => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      toast.success(mode === "create" ? "Auftrag erfolgreich angelegt." : "Auftrag aktualisiert.");
      router.push(`/auftraege/${job.id}`);
    },
    onError: (err: Error) => {
      toast.error("Fehler beim Speichern.", { description: err.message });
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((d) => mutation.mutate(d))} className="space-y-8">
        <JobFormFields form={form} showStatus={mode === "edit"} />

        <div className="flex items-center justify-end gap-3 border-t border-border pt-6">
          <Button type="button" variant="outline" onClick={() => router.back()} disabled={mutation.isPending}>
            Abbrechen
          </Button>
          <Button type="submit" className="bg-brand-500 hover:bg-brand-600 min-w-36" disabled={mutation.isPending}>
            {mutation.isPending ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Speichern …</>
            ) : mode === "create" ? "Auftrag anlegen" : "Änderungen speichern"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
