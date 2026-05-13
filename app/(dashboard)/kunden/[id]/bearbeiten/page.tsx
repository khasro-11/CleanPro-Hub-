import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CustomerForm } from "@/components/forms/CustomerForm";
import { getCustomerById } from "@/lib/customers/queries";
import { requireAdmin } from "@/lib/auth/session";
import type { CustomerFormInput } from "@/types/customer.schema";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const customer = await getCustomerById(id);
  return { title: customer ? `${customer.name} bearbeiten` : "Bearbeiten" };
}

export default async function KundeBearbeitenPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const customer = await getCustomerById(id);
  if (!customer) notFound();

  const defaultValues: Partial<CustomerFormInput> = {
    name: customer.name,
    company: customer.company ?? "",
    street: customer.street,
    zip: customer.zip,
    city: customer.city,
    phone: customer.phone ?? "",
    email: customer.email ?? "",
    customerType: customer.customerType,
    contractType: customer.contractType,
    hourlyRate: customer.hourlyRate ? String(Number(customer.hourlyRate)) : "",
    flatRate: customer.flatRate ? String(Number(customer.flatRate)) : "",
    notes: customer.notes ?? "",
    status: customer.status,
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm" className="text-muted-foreground">
          <Link href={`/kunden/${id}`}>
            <ChevronLeft className="mr-1 h-4 w-4" />
            {customer.name}
          </Link>
        </Button>
      </div>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">Kunde bearbeiten</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Aktualisieren Sie die Daten für <strong>{customer.name}</strong>.
        </p>
      </div>

      <div className="rounded-xl border border-border/60 bg-card p-6 shadow-elevated">
        <CustomerForm mode="edit" customerId={id} defaultValues={defaultValues} />
      </div>
    </div>
  );
}
