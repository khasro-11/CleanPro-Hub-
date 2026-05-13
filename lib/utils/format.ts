import { format, parseISO } from "date-fns";
import { de } from "date-fns/locale";

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, "dd.MM.yyyy", { locale: de });
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, "dd.MM.yyyy HH:mm", { locale: de });
}

export function formatTime(date: Date | string): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, "HH:mm", { locale: de });
}

export function formatCurrency(value: number | null | undefined): string {
  if (value == null) return "–";
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format(value);
}

export function formatNumber(value: number | null | undefined): string {
  if (value == null) return "–";
  return new Intl.NumberFormat("de-DE").format(value);
}

export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} Min.`;
  if (m === 0) return `${h} Std.`;
  return `${h} Std. ${m} Min.`;
}

export function formatInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}
