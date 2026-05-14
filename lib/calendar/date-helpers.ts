import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  getWeek,
  startOfDay,
  endOfDay,
} from "date-fns";
import { de } from "date-fns/locale";

export type CalendarView = "monat" | "woche" | "tag";

export function getMonthGrid(date: Date): Date[] {
  const gridStart = startOfWeek(startOfMonth(date), { weekStartsOn: 1 });
  const gridEnd = endOfWeek(endOfMonth(date), { weekStartsOn: 1 });
  return eachDayOfInterval({ start: gridStart, end: gridEnd });
}

export function getWeekDays(date: Date): Date[] {
  const weekStart = startOfWeek(date, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(date, { weekStartsOn: 1 });
  return eachDayOfInterval({ start: weekStart, end: weekEnd });
}

export function formatPeriod(date: Date, view: CalendarView): string {
  if (view === "tag") return format(date, "EEEE, d. MMMM yyyy", { locale: de });
  if (view === "monat") {
    const raw = format(date, "MMMM yyyy", { locale: de });
    return raw.charAt(0).toUpperCase() + raw.slice(1);
  }
  const kw = getWeek(date, { weekStartsOn: 1, firstWeekContainsDate: 4 });
  const ws = startOfWeek(date, { weekStartsOn: 1 });
  const we = endOfWeek(date, { weekStartsOn: 1 });
  return `KW ${kw} · ${format(ws, "d.", { locale: de })}–${format(we, "d. MMMM yyyy", { locale: de })}`;
}

export function getDateRange(date: Date, view: CalendarView): { from: Date; to: Date } {
  if (view === "tag") return { from: startOfDay(date), to: endOfDay(date) };
  if (view === "monat") {
    return {
      from: startOfWeek(startOfMonth(date), { weekStartsOn: 1 }),
      to: endOfWeek(endOfMonth(date), { weekStartsOn: 1 }),
    };
  }
  return {
    from: startOfWeek(date, { weekStartsOn: 1 }),
    to: endOfWeek(date, { weekStartsOn: 1 }),
  };
}

export const HOUR_RANGE = { start: 6, end: 22 } as const;
export const HOUR_HEIGHT = 60; // px per hour
export const HOURS = Array.from(
  { length: HOUR_RANGE.end - HOUR_RANGE.start },
  (_, i) => i + HOUR_RANGE.start
);
