"use client";

import { ChevronLeft, ChevronRight, CalendarDays, CalendarRange, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { CalendarView } from "@/lib/calendar/date-helpers";

const VIEWS: { value: CalendarView; label: string; icon: React.ReactNode }[] = [
  { value: "monat", label: "Monat", icon: <CalendarDays className="h-4 w-4" /> },
  { value: "woche", label: "Woche", icon: <CalendarRange className="h-4 w-4" /> },
  { value: "tag",   label: "Tag",   icon: <Calendar className="h-4 w-4" /> },
];

interface CalendarHeaderProps {
  view: CalendarView;
  periodTitle: string;
  onViewChange: (v: CalendarView) => void;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
}

export function CalendarHeader({
  view, periodTitle, onViewChange, onPrev, onNext, onToday,
}: CalendarHeaderProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      {/* Left: Today + nav + period */}
      <div className="flex items-center gap-2 min-w-0">
        <Button variant="outline" size="sm" onClick={onToday} className="shrink-0">
          Heute
        </Button>
        <Button variant="ghost" size="icon" onClick={onPrev} aria-label="Vorherige Periode" className="shrink-0">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={onNext} aria-label="Nächste Periode" className="shrink-0">
          <ChevronRight className="h-4 w-4" />
        </Button>
        <h2 className="truncate text-base font-semibold">{periodTitle}</h2>
      </div>

      {/* Right: View switcher */}
      <div className="flex items-center rounded-lg border border-border p-0.5 gap-0.5 self-start sm:self-auto shrink-0">
        {VIEWS.map(({ value, label, icon }) => (
          <Button
            key={value}
            variant={view === value ? "default" : "ghost"}
            size="sm"
            className={cn(
              "gap-1.5",
              view === value && "bg-brand-500 hover:bg-brand-600 text-white"
            )}
            onClick={() => onViewChange(value)}
          >
            {icon}
            <span className="hidden sm:inline">{label}</span>
          </Button>
        ))}
      </div>
    </div>
  );
}
