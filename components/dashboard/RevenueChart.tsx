"use client";

import {
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Area, AreaChart,
} from "recharts";

interface ChartEntry {
  month: string;
  umsatz: number;
}

interface RevenueChartProps {
  data: ChartEntry[];
}

function CustomTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const value = new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(payload[0].value);
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-sm shadow-floating">
      <p className="font-medium text-foreground">{label}</p>
      <p className="text-muted-foreground">{value}</p>
    </div>
  );
}

function euroTick(value: number) {
  if (value >= 1000) return `${Math.round(value / 1000)}k€`;
  return `${value}€`;
}

export function RevenueChart({ data }: RevenueChartProps) {
  const hasData = data.some((d) => d.umsatz > 0);

  if (!hasData) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
        Noch keine abgeschlossenen Aufträge für den Umsatzverlauf.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#0EA5E9" stopOpacity={0.15} />
            <stop offset="95%" stopColor="#0EA5E9" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
        <XAxis
          dataKey="month"
          tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tickFormatter={euroTick}
          tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
          axisLine={false}
          tickLine={false}
          width={52}
        />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="umsatz"
          stroke="#0EA5E9"
          strokeWidth={2}
          fill="url(#revenueGradient)"
          dot={{ r: 3, fill: "#0EA5E9", strokeWidth: 0 }}
          activeDot={{ r: 5, fill: "#0EA5E9" }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
