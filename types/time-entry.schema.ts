import { z } from "zod";

export const checkInSchema = z.object({
  employeeId: z.string().min(1, "Mitarbeiter-ID fehlt."),
  jobId: z.string().optional(),
  latLng: z.string().optional(), // "lat,lng"
  notes: z.string().optional(),
});

export const checkOutSchema = z.object({
  notes: z.string().optional(),
});

export const timeEntryListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  employeeId: z.string().optional(),
  jobId: z.string().optional(),
  from: z.string().optional(), // ISO date
  to: z.string().optional(),   // ISO date
  activeOnly: z.coerce.boolean().optional(), // no checkOut
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export const exportQuerySchema = z.object({
  employeeId: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
});

export type CheckInInput = z.output<typeof checkInSchema>;
export type CheckOutInput = z.output<typeof checkOutSchema>;
export type TimeEntryListQuery = z.output<typeof timeEntryListQuerySchema>;
export type ExportQuery = z.output<typeof exportQuerySchema>;
