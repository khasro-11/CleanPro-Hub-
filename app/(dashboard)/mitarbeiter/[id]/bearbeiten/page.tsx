import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmployeeForm } from "@/components/forms/EmployeeForm";
import { getEmployeeById } from "@/lib/employees/queries";
import { requireAdmin } from "@/lib/auth/session";
import type { EmployeeFormInput } from "@/types/employee.schema";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const emp = await getEmployeeById(id, true);
  return { title: emp ? `${emp.firstName} ${emp.lastName} bearbeiten` : "Bearbeiten" };
}

function toDateInput(date: Date | null | undefined): string {
  if (!date) return "";
  const d = new Date(date);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default async function MitarbeiterBearbeitenPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const employee = await getEmployeeById(id, true);
  if (!employee) notFound();

  const emp = employee as typeof employee & { taxId?: string; svNumber?: string };
  const fullName = `${employee.firstName} ${employee.lastName}`;

  const defaultValues: Partial<EmployeeFormInput> = {
    firstName: employee.firstName,
    lastName: employee.lastName,
    email: employee.email ?? "",
    phone: employee.phone ?? "",
    street: employee.street ?? "",
    zip: employee.zip ?? "",
    city: employee.city ?? "",
    birthDate: toDateInput(employee.birthDate),
    startDate: toDateInput(employee.startDate),
    contractType: employee.contractType,
    status: employee.status,
    hourlyWage: employee.hourlyWage ? String(Number(employee.hourlyWage)) : "",
    weeklyHours: employee.weeklyHours ?? "",
    taxId: emp.taxId ?? "",
    svNumber: emp.svNumber ?? "",
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm" className="text-muted-foreground">
          <Link href={`/mitarbeiter/${id}`}>
            <ChevronLeft className="mr-1 h-4 w-4" />
            {fullName}
          </Link>
        </Button>
      </div>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">Mitarbeiter bearbeiten</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Aktualisieren Sie die Daten für <strong>{fullName}</strong>.
        </p>
      </div>

      <div className="rounded-xl border border-border/60 bg-card p-6 shadow-elevated">
        <EmployeeForm mode="edit" employeeId={id} defaultValues={defaultValues} />
      </div>
    </div>
  );
}
