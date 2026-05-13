"use client";

import type { UseFormReturn } from "react-hook-form";
import {
  FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { EmployeeContractType, EmployeeStatus } from "@prisma/client";
import { EMPLOYEE_CONTRACT_TYPE_LABELS, EMPLOYEE_STATUS_LABELS } from "@/lib/utils/labels";
import type { EmployeeFormInput } from "@/types/employee.schema";

interface EmployeeFormFieldsProps {
  form: UseFormReturn<EmployeeFormInput>;
  isAdmin: boolean;
}

export function EmployeeFormFields({ form, isAdmin }: EmployeeFormFieldsProps) {
  return (
    <div className="space-y-6">
      {/* Personal */}
      <div>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Persönliche Daten
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField control={form.control} name="firstName" render={({ field }) => (
            <FormItem>
              <FormLabel>Vorname *</FormLabel>
              <FormControl><Input placeholder="Max" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="lastName" render={({ field }) => (
            <FormItem>
              <FormLabel>Nachname *</FormLabel>
              <FormControl><Input placeholder="Mustermann" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="email" render={({ field }) => (
            <FormItem>
              <FormLabel>E-Mail</FormLabel>
              <FormControl><Input type="email" placeholder="max@cleanpro.de" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="phone" render={({ field }) => (
            <FormItem>
              <FormLabel>Telefon</FormLabel>
              <FormControl><Input placeholder="+49 170 1234567" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="birthDate" render={({ field }) => (
            <FormItem>
              <FormLabel>Geburtsdatum</FormLabel>
              <FormControl><Input type="date" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>
      </div>

      {/* Address */}
      <div>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Adresse
        </h3>
        <div className="space-y-4">
          <FormField control={form.control} name="street" render={({ field }) => (
            <FormItem>
              <FormLabel>Straße & Hausnummer</FormLabel>
              <FormControl><Input placeholder="Musterstraße 1" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <div className="grid gap-4 sm:grid-cols-3">
            <FormField control={form.control} name="zip" render={({ field }) => (
              <FormItem>
                <FormLabel>PLZ</FormLabel>
                <FormControl><Input placeholder="60311" maxLength={5} {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="city" render={({ field }) => (
              <FormItem className="sm:col-span-2">
                <FormLabel>Stadt</FormLabel>
                <FormControl><Input placeholder="Frankfurt am Main" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </div>
        </div>
      </div>

      {/* Employment */}
      <div>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Beschäftigung
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField control={form.control} name="contractType" render={({ field }) => (
            <FormItem>
              <FormLabel>Vertragsart *</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl><SelectTrigger><SelectValue placeholder="Vertragsart wählen" /></SelectTrigger></FormControl>
                <SelectContent>
                  {(Object.keys(EMPLOYEE_CONTRACT_TYPE_LABELS) as EmployeeContractType[]).map((t) => (
                    <SelectItem key={t} value={t}>{EMPLOYEE_CONTRACT_TYPE_LABELS[t]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="status" render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                <SelectContent>
                  {(Object.keys(EMPLOYEE_STATUS_LABELS) as EmployeeStatus[]).map((s) => (
                    <SelectItem key={s} value={s}>{EMPLOYEE_STATUS_LABELS[s]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="startDate" render={({ field }) => (
            <FormItem>
              <FormLabel>Eintrittsdatum</FormLabel>
              <FormControl><Input type="date" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="hourlyWage" render={({ field }) => (
            <FormItem>
              <FormLabel>Stundenlohn (€)</FormLabel>
              <FormControl><Input placeholder="14,50" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="weeklyHours" render={({ field }) => (
            <FormItem>
              <FormLabel>Wochenstunden</FormLabel>
              <FormControl><Input type="number" min={1} max={168} placeholder="40" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>
      </div>

      {/* Sensitive — Admin only */}
      {isAdmin && (
        <div>
          <h3 className="mb-1 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Vertrauliche Daten
          </h3>
          <p className="mb-3 text-xs text-muted-foreground">
            Nur für Administratoren sichtbar. Wird verschlüsselt gespeichert.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField control={form.control} name="taxId" render={({ field }) => (
              <FormItem>
                <FormLabel>Steuer-ID</FormLabel>
                <FormControl><Input placeholder="12 345 678 901" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="svNumber" render={({ field }) => (
              <FormItem>
                <FormLabel>Sozialversicherungsnummer</FormLabel>
                <FormControl><Input placeholder="65 070893 A 001" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </div>
        </div>
      )}
    </div>
  );
}
