"use client";

import { useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { JOB_STATUS_LABELS } from "@/lib/utils/labels";
import type { JobStatus } from "@prisma/client";

const STATUS_DOT: Record<JobStatus, string> = {
  GEPLANT: "bg-brand-500",
  IN_BEARBEITUNG: "bg-amber-500",
  ABGESCHLOSSEN: "bg-emerald-500",
  ABGESAGT: "bg-red-400",
};

const ALL_STATUSES: JobStatus[] = ["GEPLANT", "IN_BEARBEITUNG", "ABGESCHLOSSEN", "ABGESAGT"];

interface EmployeeOption { id: string; firstName: string; lastName: string }

interface CalendarFiltersProps {
  isAdmin: boolean;
  selectedEmployees: string[];
  selectedStatuses: string[];
  search: string;
  onEmployeesChange: (ids: string[]) => void;
  onStatusesChange: (statuses: string[]) => void;
  onSearchChange: (search: string) => void;
  onReset: () => void;
}

export function CalendarFilters({
  isAdmin, selectedEmployees, selectedStatuses, search,
  onEmployeesChange, onStatusesChange, onSearchChange, onReset,
}: CalendarFiltersProps) {
  const searchRef = useRef<HTMLInputElement>(null);

  const { data: empData } = useQuery<{ employees: EmployeeOption[] }>({
    queryKey: ["employees-filter"],
    queryFn: async () => {
      const res = await fetch("/api/employees?limit=100&status=AKTIV");
      const json = await res.json() as { ok: boolean; data: { employees: EmployeeOption[] } };
      return json.data;
    },
    enabled: isAdmin,
  });

  const employees = empData?.employees ?? [];
  const activeCount = selectedEmployees.length +
    (selectedStatuses.length < ALL_STATUSES.length ? 1 : 0) +
    (search ? 1 : 0);

  function toggleEmployee(id: string) {
    onEmployeesChange(
      selectedEmployees.includes(id)
        ? selectedEmployees.filter((e) => e !== id)
        : [...selectedEmployees, id]
    );
  }

  function toggleStatus(s: JobStatus) {
    onStatusesChange(
      selectedStatuses.includes(s)
        ? selectedStatuses.filter((x) => x !== s)
        : [...selectedStatuses, s]
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Search */}
      <div className="relative">
        <Input
          ref={searchRef}
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Suchen…"
          className="h-8 w-40 pr-7 text-sm"
        />
        {search && (
          <button
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            onClick={() => onSearchChange("")}
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>

      {/* Status filter */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
            <Filter className="h-3.5 w-3.5" />
            Status
            {selectedStatuses.length < ALL_STATUSES.length && (
              <Badge variant="secondary" className="h-4 px-1 text-[10px] leading-none">
                {selectedStatuses.length}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-44 p-1" align="start">
          {ALL_STATUSES.map((s) => {
            const active = selectedStatuses.includes(s);
            return (
              <button
                key={s}
                className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
                onClick={() => toggleStatus(s)}
              >
                <div className={cn(
                  "h-4 w-4 shrink-0 rounded border border-border flex items-center justify-center transition-colors",
                  active && "bg-brand-500 border-brand-500"
                )}>
                  {active && <Check className="h-3 w-3 text-white" />}
                </div>
                <span className={cn("h-2 w-2 shrink-0 rounded-full", STATUS_DOT[s])} />
                {JOB_STATUS_LABELS[s]}
              </button>
            );
          })}
        </PopoverContent>
      </Popover>

      {/* Employee filter (admin only) */}
      {isAdmin && employees.length > 0 && (
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
              Mitarbeiter
              {selectedEmployees.length > 0 && (
                <Badge variant="secondary" className="h-4 px-1 text-[10px] leading-none">
                  {selectedEmployees.length}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-52 p-1" align="start">
            {employees.map((emp) => {
              const active = selectedEmployees.includes(emp.id);
              return (
                <button
                  key={emp.id}
                  className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
                  onClick={() => toggleEmployee(emp.id)}
                >
                  <div className={cn(
                    "h-4 w-4 shrink-0 rounded border border-border flex items-center justify-center transition-colors",
                    active && "bg-brand-500 border-brand-500"
                  )}>
                    {active && <Check className="h-3 w-3 text-white" />}
                  </div>
                  {emp.firstName} {emp.lastName}
                </button>
              );
            })}
          </PopoverContent>
        </Popover>
      )}

      {/* Reset */}
      {activeCount > 0 && (
        <Button variant="ghost" size="sm" className="h-8 text-xs text-muted-foreground" onClick={onReset}>
          <X className="mr-1 h-3 w-3" />
          Filter zurücksetzen
        </Button>
      )}
    </div>
  );
}
