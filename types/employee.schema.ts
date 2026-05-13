import { z } from "zod";
import { EmployeeContractType, EmployeeStatus } from "@prisma/client";

export const employeeFormSchema = z.object({
  firstName: z.string().min(2, "Vorname muss mindestens 2 Zeichen lang sein."),
  lastName: z.string().min(2, "Nachname muss mindestens 2 Zeichen lang sein."),
  email: z.string().email("Ungültige E-Mail-Adresse.").optional().or(z.literal("")),
  phone: z.string().optional(),
  street: z.string().optional(),
  zip: z
    .string()
    .regex(/^\d{5}$/, "PLZ muss aus 5 Ziffern bestehen.")
    .optional()
    .or(z.literal("")),
  city: z.string().optional(),
  birthDate: z.string().optional(), // yyyy-MM-dd from native date input
  startDate: z.string().optional(), // yyyy-MM-dd from native date input
  contractType: z.nativeEnum(EmployeeContractType, {
    errorMap: () => ({ message: "Bitte Vertragsart auswählen." }),
  }),
  status: z.nativeEnum(EmployeeStatus).default(EmployeeStatus.AKTIV),
  hourlyWage: z
    .string()
    .optional()
    .transform((v) => (v ? parseFloat(v.replace(",", ".")) : undefined))
    .pipe(z.number().positive("Stundenlohn muss positiv sein.").optional()),
  weeklyHours: z.coerce.number().int().min(1).max(168).optional().or(z.literal("")),
  // Sensitive — admin only; plain text, encrypted server-side
  taxId: z.string().optional(),
  svNumber: z.string().optional(),
});

export const employeeUpdateSchema = employeeFormSchema.partial();

export const employeeListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  status: z.nativeEnum(EmployeeStatus).optional(),
  contractType: z.nativeEnum(EmployeeContractType).optional(),
  sortBy: z.enum(["lastName", "createdAt", "status", "startDate"]).default("lastName"),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
});

export type EmployeeFormInput = z.input<typeof employeeFormSchema>;
export type EmployeeFormData = z.output<typeof employeeFormSchema>;
export type EmployeeListQuery = z.output<typeof employeeListQuerySchema>;
