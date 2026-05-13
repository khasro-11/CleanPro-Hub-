"use client";

import { useQuery } from "@tanstack/react-query";
import { Check } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { formatInitials } from "@/lib/utils/format";
import { cn } from "@/lib/utils";

interface EmployeeOption {
  id: string;
  firstName: string;
  lastName: string;
  photoUrl?: string | null;
  status: string;
}

interface EmployeeMultiSelectProps {
  value: string[];
  onChange: (ids: string[]) => void;
}

export function EmployeeMultiSelect({ value, onChange }: EmployeeMultiSelectProps) {
  const { data, isLoading } = useQuery<{ employees: EmployeeOption[] }>({
    queryKey: ["employees-select"],
    queryFn: async () => {
      const res = await fetch("/api/employees?status=AKTIV&limit=100&sortBy=lastName");
      const json = (await res.json()) as { ok: boolean; data: { employees: EmployeeOption[] } };
      if (!json.ok) throw new Error("Fehler beim Laden der Mitarbeiter.");
      return json.data;
    },
  });

  function toggle(id: string) {
    if (value.includes(id)) {
      onChange(value.filter((v) => v !== id));
    } else {
      onChange([...value, id]);
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 rounded-lg border border-border p-3">
            <Skeleton className="h-7 w-7 rounded-full" />
            <Skeleton className="h-4 w-32" />
          </div>
        ))}
      </div>
    );
  }

  const employees = data?.employees ?? [];

  if (employees.length === 0) {
    return (
      <p className="text-sm text-muted-foreground rounded-lg border border-border p-4 text-center">
        Keine aktiven Mitarbeiter vorhanden.
      </p>
    );
  }

  return (
    <div className="space-y-1.5 max-h-56 overflow-y-auto rounded-lg border border-border p-2">
      {employees.map((emp) => {
        const selected = value.includes(emp.id);
        return (
          <button
            key={emp.id}
            type="button"
            onClick={() => toggle(emp.id)}
            className={cn(
              "flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors duration-100",
              selected
                ? "bg-brand-500/10 text-brand-700 dark:text-brand-300"
                : "hover:bg-muted/60 text-foreground"
            )}
          >
            <Avatar className="h-7 w-7 shrink-0">
              <AvatarFallback className="bg-brand-500/10 text-brand-600 text-xs font-semibold">
                {formatInitials(emp.firstName, emp.lastName)}
              </AvatarFallback>
            </Avatar>
            <span className="flex-1 font-medium">
              {emp.firstName} {emp.lastName}
            </span>
            {selected && <Check className="h-4 w-4 text-brand-500 shrink-0" />}
          </button>
        );
      })}
    </div>
  );
}
