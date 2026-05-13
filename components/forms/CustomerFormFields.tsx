"use client";

import type { UseFormReturn } from "react-hook-form";
import {
  FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { CustomerType, ContractType, CustomerStatus } from "@prisma/client";
import {
  CUSTOMER_TYPE_LABELS, CONTRACT_TYPE_LABELS, CUSTOMER_STATUS_LABELS,
} from "@/lib/utils/labels";
import type { CustomerFormInput } from "@/types/customer.schema";

interface CustomerFormFieldsProps {
  form: UseFormReturn<CustomerFormInput>;
  showStatus?: boolean;
}

export function CustomerFormFields({ form, showStatus = false }: CustomerFormFieldsProps) {
  return (
    <div className="space-y-6">
      {/* Contact */}
      <div>
        <h3 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Kontakt
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField control={form.control} name="name" render={({ field }) => (
            <FormItem>
              <FormLabel>Name *</FormLabel>
              <FormControl><Input placeholder="Max Mustermann" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="company" render={({ field }) => (
            <FormItem>
              <FormLabel>Firma</FormLabel>
              <FormControl><Input placeholder="Musterfirma GmbH" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>
      </div>

      {/* Address */}
      <div>
        <h3 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Adresse
        </h3>
        <div className="space-y-4">
          <FormField control={form.control} name="street" render={({ field }) => (
            <FormItem>
              <FormLabel>Straße & Hausnummer *</FormLabel>
              <FormControl><Input placeholder="Musterstraße 1" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <div className="grid gap-4 sm:grid-cols-3">
            <FormField control={form.control} name="zip" render={({ field }) => (
              <FormItem>
                <FormLabel>PLZ *</FormLabel>
                <FormControl><Input placeholder="60311" maxLength={5} {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="city" render={({ field }) => (
              <FormItem className="sm:col-span-2">
                <FormLabel>Stadt *</FormLabel>
                <FormControl><Input placeholder="Frankfurt am Main" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField control={form.control} name="phone" render={({ field }) => (
              <FormItem>
                <FormLabel>Telefon</FormLabel>
                <FormControl><Input placeholder="+49 69 12345678" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="email" render={({ field }) => (
              <FormItem>
                <FormLabel>E-Mail</FormLabel>
                <FormControl><Input type="email" placeholder="name@beispiel.de" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </div>
        </div>
      </div>

      {/* Contract */}
      <div>
        <h3 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Vertrag & Preise
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField control={form.control} name="customerType" render={({ field }) => (
            <FormItem>
              <FormLabel>Reinigungstyp *</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger><SelectValue placeholder="Typ auswählen" /></SelectTrigger>
                </FormControl>
                <SelectContent>
                  {(Object.keys(CUSTOMER_TYPE_LABELS) as CustomerType[]).map((t) => (
                    <SelectItem key={t} value={t}>{CUSTOMER_TYPE_LABELS[t]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="contractType" render={({ field }) => (
            <FormItem>
              <FormLabel>Vertragstyp *</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger><SelectValue placeholder="Vertrag auswählen" /></SelectTrigger>
                </FormControl>
                <SelectContent>
                  {(Object.keys(CONTRACT_TYPE_LABELS) as ContractType[]).map((t) => (
                    <SelectItem key={t} value={t}>{CONTRACT_TYPE_LABELS[t]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="hourlyRate" render={({ field }) => (
            <FormItem>
              <FormLabel>Stundensatz (€)</FormLabel>
              <FormControl><Input placeholder="25,00" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="flatRate" render={({ field }) => (
            <FormItem>
              <FormLabel>Pauschale (€)</FormLabel>
              <FormControl><Input placeholder="350,00" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>
      </div>

      {/* Status + Notes */}
      <div className="grid gap-4 sm:grid-cols-2">
        {showStatus && (
          <FormField control={form.control} name="status" render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                </FormControl>
                <SelectContent>
                  {(Object.keys(CUSTOMER_STATUS_LABELS) as CustomerStatus[]).map((s) => (
                    <SelectItem key={s} value={s}>{CUSTOMER_STATUS_LABELS[s]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />
        )}
        <FormField control={form.control} name="notes" render={({ field }) => (
          <FormItem className={showStatus ? "" : "sm:col-span-2"}>
            <FormLabel>Notizen</FormLabel>
            <FormControl>
              <Textarea placeholder="Hinweise, Besonderheiten …" rows={3} {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />
      </div>
    </div>
  );
}
