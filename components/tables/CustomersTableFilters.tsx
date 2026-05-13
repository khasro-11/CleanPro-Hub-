"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { CUSTOMER_TYPE_LABELS, CUSTOMER_STATUS_LABELS } from "@/lib/utils/labels";
import { CustomerType, CustomerStatus } from "@prisma/client";

export function CustomersTableFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const search = params.get("search") ?? "";
  const status = params.get("status") ?? "alle";
  const type = params.get("customerType") ?? "alle";

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

  const hasFilters = search || status !== "alle" || type !== "alle";

  function reset() {
    router.replace(pathname);
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="relative flex-1 max-w-xs">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Name, Firma, Stadt …"
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
        <SelectTrigger className="w-40">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="alle">Alle Status</SelectItem>
          {(Object.keys(CUSTOMER_STATUS_LABELS) as CustomerStatus[]).map((s) => (
            <SelectItem key={s} value={s}>
              {CUSTOMER_STATUS_LABELS[s]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={type} onValueChange={(v) => update("customerType", v)}>
        <SelectTrigger className="w-44">
          <SelectValue placeholder="Typ" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="alle">Alle Typen</SelectItem>
          {(Object.keys(CUSTOMER_TYPE_LABELS) as CustomerType[]).map((t) => (
            <SelectItem key={t} value={t}>
              {CUSTOMER_TYPE_LABELS[t]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={reset} className="text-muted-foreground">
          <X className="mr-1.5 h-3.5 w-3.5" />
          Zurücksetzen
        </Button>
      )}
    </div>
  );
}
