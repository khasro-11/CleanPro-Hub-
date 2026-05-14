import { z } from "zod";
import { CustomerType, ContractType, CustomerStatus } from "@prisma/client";

export const customerFormSchema = z.object({
  name: z.string().min(2, "Name muss mindestens 2 Zeichen lang sein."),
  company: z.string().optional(),
  street: z.string().min(3, "Bitte geben Sie eine gültige Straße an."),
  zip: z.string().regex(/^\d{5}$/, "PLZ muss aus 5 Ziffern bestehen."),
  city: z.string().min(2, "Bitte geben Sie eine Stadt an."),
  phone: z.string().optional(),
  email: z.string().email("Ungültige E-Mail-Adresse.").optional().or(z.literal("")),
  customerType: z.nativeEnum(CustomerType, { errorMap: () => ({ message: "Bitte Reinigungstyp auswählen." }) }),
  contractType: z.nativeEnum(ContractType, { errorMap: () => ({ message: "Bitte Vertragstyp auswählen." }) }),
  hourlyRate: z
    .string()
    .optional()
    .transform((v) => (v ? parseFloat(v.replace(",", ".")) : undefined))
    .pipe(z.number().positive("Stundensatz muss positiv sein.").optional()),
  flatRate: z
    .string()
    .optional()
    .transform((v) => (v ? parseFloat(v.replace(",", ".")) : undefined))
    .pipe(z.number().positive("Pauschalpreis muss positiv sein.").optional()),
  notes: z.string().optional(),
  status: z.nativeEnum(CustomerStatus).default(CustomerStatus.AKTIV),
});

export const customerUpdateSchema = customerFormSchema.partial().extend({
  status: z.nativeEnum(CustomerStatus).optional(),
});

// API body schemas — accept numbers directly (form's zodResolver already ran the string→number transform)
export const customerApiBodySchema = customerFormSchema.extend({
  hourlyRate: z.number().positive("Stundensatz muss positiv sein.").optional(),
  flatRate: z.number().positive("Pauschalpreis muss positiv sein.").optional(),
});
export const customerApiUpdateBodySchema = customerApiBodySchema.partial().extend({
  status: z.nativeEnum(CustomerStatus).optional(),
});

export const customerListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  status: z.nativeEnum(CustomerStatus).optional(),
  customerType: z.nativeEnum(CustomerType).optional(),
  sortBy: z.enum(["name", "createdAt", "status", "customerType"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type CustomerFormInput = z.input<typeof customerFormSchema>;
export type CustomerFormData = z.output<typeof customerFormSchema>;
export type CustomerListQuery = z.output<typeof customerListQuerySchema>;
