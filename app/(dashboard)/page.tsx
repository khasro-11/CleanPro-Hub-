import { format } from "date-fns";
import { de } from "date-fns/locale";

import { getDashboardKpis, getTodayJobs, getUpcomingJobs, getEmployeeHoursChartData, getRevenueChartData } from "@/lib/dashboard/queries";
import { KpiCards } from "@/components/dashboard/KpiCards";
import { EmployeeHoursChart } from "@/components/dashboard/EmployeeHoursChart";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { TodayJobsList } from "@/components/dashboard/TodayJobsList";
import { UpcomingJobsList } from "@/components/dashboard/UpcomingJobsList";

export default async function DashboardPage() {
  const [kpis, todayJobs, upcomingJobs, employeeHours, revenueData] = await Promise.all([
    getDashboardKpis(),
    getTodayJobs(),
    getUpcomingJobs(),
    getEmployeeHoursChartData(),
    getRevenueChartData(),
  ]);

  const today = format(new Date(), "EEEE, d. MMMM yyyy", { locale: de });

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Dashboard</h1>
        <p className="mt-0.5 text-sm capitalize text-muted-foreground">{today}</p>
      </div>

      <KpiCards data={kpis} />

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border/60 bg-card p-5 shadow-elevated">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Umsatzverlauf (12 Monate)
          </h2>
          <RevenueChart data={revenueData} />
        </div>
        <div className="rounded-xl border border-border/60 bg-card p-5 shadow-elevated">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Stunden pro Mitarbeiter (4 Wochen)
          </h2>
          <EmployeeHoursChart data={employeeHours} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border/60 bg-card p-5 shadow-elevated">
          <TodayJobsList jobs={todayJobs} />
        </div>
        <div className="rounded-xl border border-border/60 bg-card p-5 shadow-elevated">
          <UpcomingJobsList jobs={upcomingJobs} />
        </div>
      </div>
    </div>
  );
}
