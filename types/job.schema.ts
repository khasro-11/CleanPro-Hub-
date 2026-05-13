import { z } from "zod";
import { JobStatus, RecurrenceType } from "@prisma/client";

export const jobFormSchema = z.object({
  title: z.string().min(2, "Titel muss mindestens 2 Zeichen lang sein."),
  customerId: z.string().min(1, "Bitte einen Kunden auswählen."),
  scheduledAt: z.string().min(1, "Bitte Datum und Uhrzeit angeben."), // datetime-local value
  duration: z.coerce
    .number({ invalid_type_error: "Dauer muss eine Zahl sein." })
    .int()
    .min(15, "Mindestdauer: 15 Minuten.")
    .max(1440, "Maximaldauer: 24 Stunden."),
  recurrence: z.nativeEnum(RecurrenceType).default(RecurrenceType.EINMALIG),
  employeeIds: z.array(z.string()).default([]),
  description: z.string().optional(),
  notes: z.string().optional(),
  status: z.nativeEnum(JobStatus).default(JobStatus.GEPLANT),
});

export const jobUpdateSchema = jobFormSchema.partial();

export const jobStatusSchema = z.object({
  status: z.nativeEnum(JobStatus, { errorMap: () => ({ message: "Ungültiger Status." }) }),
});

export const jobListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  search: z.string().optional(),
  status: z.nativeEnum(JobStatus).optional(),
  customerId: z.string().optional(),
  employeeId: z.string().optional(),
  from: z.string().optional(), // ISO date
  to: z.string().optional(),   // ISO date
  sortBy: z.enum(["scheduledAt", "createdAt", "status", "title"]).default("scheduledAt"),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
});

export type JobFormInput = z.input<typeof jobFormSchema>;
export type JobFormData = z.output<typeof jobFormSchema>;
export type JobListQuery = z.output<typeof jobListQuerySchema>;
