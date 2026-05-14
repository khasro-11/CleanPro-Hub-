"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { JOB_STATUS_LABELS } from "@/lib/utils/labels";
import { cn } from "@/lib/utils";
import type { ApiResponse } from "@/types/api";
import type { Job } from "@prisma/client";
import { JobStatus } from "@prisma/client";

const TRANSITIONS: Record<JobStatus, JobStatus[]> = {
  GEPLANT: ["IN_BEARBEITUNG", "ABGESAGT"],
  IN_BEARBEITUNG: ["ABGESCHLOSSEN", "ABGESAGT"],
  ABGESCHLOSSEN: [],
  ABGESAGT: ["GEPLANT"],
};

const BUTTON_STYLES: Partial<Record<JobStatus, string>> = {
  IN_BEARBEITUNG: "bg-amber-500 hover:bg-amber-600 text-white border-transparent",
  ABGESCHLOSSEN: "bg-emerald-600 hover:bg-emerald-700 text-white border-transparent",
  ABGESAGT: "border-destructive text-destructive hover:bg-destructive/5",
  GEPLANT: "",
};

interface JobStatusButtonProps {
  jobId: string;
  currentStatus: JobStatus;
}

export function JobStatusButton({ jobId, currentStatus }: JobStatusButtonProps) {
  const queryClient = useQueryClient();
  const next = TRANSITIONS[currentStatus];

  const mutation = useMutation({
    mutationKey: ["jobs", "status", jobId],
    mutationFn: async (status: JobStatus) => {
      const res = await fetch(`/api/jobs/${jobId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const json = (await res.json()) as ApiResponse<Job>;
      if (!json.ok) throw new Error(json.error.message);
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      queryClient.invalidateQueries({ queryKey: ["job", jobId] });
      toast.success("Status aktualisiert.");
    },
    onError: (err: Error) => {
      toast.error("Fehler beim Aktualisieren.", { description: err.message });
    },
  });

  if (next.length === 0) return null;

  return (
    <div className="flex gap-2">
      {next.map((status) => (
        <Button
          key={status}
          variant="outline"
          size="sm"
          disabled={mutation.isPending}
          onClick={() => mutation.mutate(status)}
          className={cn("font-medium", BUTTON_STYLES[status])}
        >
          {JOB_STATUS_LABELS[status]}
        </Button>
      ))}
    </div>
  );
}
