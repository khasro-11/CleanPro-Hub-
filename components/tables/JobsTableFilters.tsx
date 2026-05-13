"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { JOB_STATUS_LABELS } from "@/lib/utils/labels";
import { JobStatus } from "@prisma/client";

export function JobsTableFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const search = params.get("search") ?? "";
  const status = params.get("status") ?? "alle";
  const from = params.get("from") ?? "";
  const to = params.get("to") ?? "";

  const update = useCallback(
    (key: string, value: string) => {
      const next = new URLSearchParams(params.toString());
      if (value && value !== "alle") {
        next.set(key, value);
      } else {
        next.delete(key);
      }
      next.delete("page");
      router.replace(`${pathname}?${next.toString()}`);
    },
    [params, pathname, router]
  );

  const hasFilters = search || status !== "alle" || from || to;

  function reset() {
    router.replace(pathname);
  }

  return (
    <div className="flex flex-wrap gap-3 items-center">
      <div className="relative flex-1 min-w-48 max-w-xs">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Titel, Kunde …"
          className="pl-9"
          defaultValue={search}
          onChange={(e) => {
            clearTimeout((window as Window & { _st?: ReturnType<typeof setTimeout> })._st);
            (window as Window & { _st?: ReturnType<typeof setTimeout> })._st = setTimeout(
              () => update("search", e.target.value),
              300
            );
          }}
        />
      </div>

      <Select value={status} onValueChange={(v) => update("status", v)}>
        <SelectTrigger className="w-44">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="alle">Alle Status</SelectItem>
          {(Object.keys(JOB_STATUS_LABELS) as JobStatus[]).map((s) => (
            <SelectItem key={s} value={s}>{JOB_STATUS_LABELS[s]}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="flex items-center gap-2">
        <Input
          type="date"
          className="w-38"
          value={from}
          onChange={(e) => update("from", e.target.value)}
          title="Von Datum"
        />
        <span className="text-muted-foreground text-sm">–</span>
        <Input
          type="date"
          className="w-38"
          value={to}
          onChange={(e) => update("to", e.target.value)}
          title="Bis Datum"
        />
      </div>

      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={reset} className="text-muted-foreground">
          <X className="mr-1.5 h-3.5 w-3.5" />
          Zurücksetzen
        </Button>
      )}
    </div>
  );
}
