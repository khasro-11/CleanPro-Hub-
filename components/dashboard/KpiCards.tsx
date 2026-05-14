import { Users, UserCheck, ClipboardList, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { formatCurrency } from "@/lib/utils/format";
import { cn } from "@/lib/utils";

interface KpiData {
  customers: { total: number; active: number };
  employees: { total: number; active: number };
  jobs: { today: number; open: number };
  revenue: { current: number; trend: number | null };
}

interface KpiCardsProps {
  data: KpiData;
}

export function KpiCards({ data }: KpiCardsProps) {
  const { customers, employees, jobs, revenue } = data;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <KpiCard
        icon={<Users className="h-5 w-5 text-brand-500" />}
        label="Kunden"
        value={String(customers.total)}
        sub={`${customers.active} aktiv`}
        color="brand"
      />
      <KpiCard
        icon={<UserCheck className="h-5 w-5 text-emerald-500" />}
        label="Mitarbeiter"
        value={String(employees.total)}
        sub={`${employees.active} aktiv`}
        color="emerald"
      />
      <KpiCard
        icon={<ClipboardList className="h-5 w-5 text-amber-500" />}
        label="Aufträge"
        value={String(jobs.open)}
        sub={`${jobs.today} heute`}
        color="amber"
      />
      <KpiCard
        icon={<TrendIcon trend={revenue.trend} />}
        label="Umsatz (Monat)"
        value={formatCurrency(revenue.current)}
        sub={
          revenue.trend !== null
            ? revenue.trend >= 0
              ? `+${revenue.trend}% zum Vormonat`
              : `${revenue.trend}% zum Vormonat`
            : "Kein Vormonatswert"
        }
        color={revenue.trend !== null && revenue.trend < 0 ? "red" : "violet"}
      />
    </div>
  );
}

function TrendIcon({ trend }: { trend: number | null }) {
  if (trend === null) return <Minus className="h-5 w-5 text-violet-500" />;
  if (trend >= 0) return <TrendingUp className="h-5 w-5 text-violet-500" />;
  return <TrendingDown className="h-5 w-5 text-red-500" />;
}

type CardColor = "brand" | "emerald" | "amber" | "violet" | "red";

const COLOR_MAP: Record<CardColor, string> = {
  brand:   "bg-brand-500/8 dark:bg-brand-500/10",
  emerald: "bg-emerald-500/8 dark:bg-emerald-500/10",
  amber:   "bg-amber-500/8 dark:bg-amber-500/10",
  violet:  "bg-violet-500/8 dark:bg-violet-500/10",
  red:     "bg-red-500/8 dark:bg-red-500/10",
};

function KpiCard({
  icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  color: CardColor;
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-card p-5 shadow-elevated">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
        <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg", COLOR_MAP[color])}>
          {icon}
        </div>
      </div>
      <p className="text-2xl font-bold tracking-tight text-foreground">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{sub}</p>
    </div>
  );
}
