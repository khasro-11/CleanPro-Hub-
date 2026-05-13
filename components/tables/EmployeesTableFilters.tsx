"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { EMPLOYEE_STATUS_LABELS, EMPLOYEE_CONTRACT_TYPE_LABELS } from "@/lib/utils/labels";
import { EmployeeStatus, EmployeeContractType } from "@prisma/client";

export function EmployeesTableFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const search = params.get("search") ?? "";
  const status = params.get("status") ?? "alle";
  const contractType = params.get("contractType") ?? "alle";

  const update = useCallback(
    (key: string, value: string) => {
      const next = new URLSearchParams(params.toString());
      if (value && value !== "alle") next.set(key, value);
      else next.delete(key);
      next.delete("page");
      router.replace(`${pathname}?${next.toString()}`);
    },
    [params, pathname, router]
  );

  const hasFilters = search || status !== "alle" || contractType !== "alle";

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="relative flex-1 max-w-xs">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Name, E-Mail, Stadt …"
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
        <SelectTrigger className="w-36">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="alle">Alle Status</SelectItem>
          {(Object.keys(EMPLOYEE_STATUS_LABELS) as EmployeeStatus[]).map((s) => (
            <SelectItem key={s} value={s}>{EMPLOYEE_STATUS_LABELS[s]}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={contractType} onValueChange={(v) => update("contractType", v)}>
        <SelectTrigger className="w-36">
          <SelectValue placeholder="Vertragsart" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="alle">Alle Verträge</SelectItem>
          {(Object.keys(EMPLOYEE_CONTRACT_TYPE_LABELS) as EmployeeContractType[]).map((t) => (
            <SelectItem key={t} value={t}>{EMPLOYEE_CONTRACT_TYPE_LABELS[t]}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={() => router.replace(pathname)} className="text-muted-foreground">
          <X className="mr-1.5 h-3.5 w-3.5" />
          Zurücksetzen
        </Button>
      )}
    </div>
  );
}
