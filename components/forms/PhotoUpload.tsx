"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Camera, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { ApiResponse } from "@/types/api";

interface PhotoUploadProps {
  employeeId: string;
  currentPhotoUrl?: string | null;
  initials: string;
  onSuccess?: (photoUrl: string) => void;
}

export function PhotoUpload({ employeeId, currentPhotoUrl, initials, onSuccess }: PhotoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(currentPhotoUrl ?? null);
  const [uploading, setUploading] = useState(false);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const localPreview = URL.createObjectURL(file);
    setPreview(localPreview);
    setUploading(true);

    try {
      const fd = new FormData();
      fd.append("photo", file);

      const res = await fetch(`/api/employees/${employeeId}/photo`, {
        method: "POST",
        body: fd,
      });
      const json = (await res.json()) as ApiResponse<{ photoUrl: string }>;

      if (!json.ok) {
        setPreview(currentPhotoUrl ?? null);
        toast.error("Foto konnte nicht hochgeladen werden.", { description: json.error.message });
        return;
      }

      toast.success("Foto erfolgreich gespeichert.");
      onSuccess?.(json.data.photoUrl);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
        <div className="h-24 w-24 rounded-full overflow-hidden border-2 border-border bg-muted flex items-center justify-center">
          {preview ? (
            <Image src={preview} alt="Foto" fill className="object-cover" sizes="96px" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-brand-500/10">
              <span className="text-2xl font-bold text-brand-600">{initials}</span>
            </div>
          )}
        </div>
        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40">
            <Loader2 className="h-6 w-6 animate-spin text-white" />
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFileChange}
        aria-label="Foto hochladen"
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
      >
        <Camera className="mr-2 h-3.5 w-3.5" />
        {preview ? "Foto ändern" : "Foto hochladen"}
      </Button>
      <p className="text-xs text-muted-foreground">JPG, PNG oder WebP · max. 5 MB</p>
    </div>
  );
}
