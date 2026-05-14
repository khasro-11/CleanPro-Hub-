"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { ApiResponse } from "@/types/api";

interface DeleteJobButtonProps {
  jobId: string;
  jobTitle: string;
}

export function DeleteJobButton({ jobId, jobTitle }: DeleteJobButtonProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationKey: ["jobs", "delete", jobId],
    mutationFn: async () => {
      const res = await fetch(`/api/jobs/${jobId}`, { method: "DELETE" });
      const json = (await res.json()) as ApiResponse<{ id: string }>;
      if (!json.ok) throw new Error(json.error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      toast.success(`Auftrag „${jobTitle}" wurde archiviert.`);
      router.push("/auftraege");
    },
    onError: (err: Error) => {
      toast.error("Fehler beim Archivieren.", { description: err.message });
      setOpen(false);
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="text-destructive hover:text-destructive hover:bg-destructive/5">
          <Trash2 className="mr-2 h-4 w-4" />
          Löschen
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Auftrag löschen?</DialogTitle>
          <DialogDescription>
            Möchten Sie <strong>{jobTitle}</strong> wirklich löschen? Der Auftrag wird archiviert
            und nicht mehr angezeigt. Dieser Vorgang kann vom Administrator rückgängig gemacht werden.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={mutation.isPending}>
            Abbrechen
          </Button>
          <Button
            variant="destructive"
            disabled={mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Löschen …</>
            ) : (
              "Endgültig löschen"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
