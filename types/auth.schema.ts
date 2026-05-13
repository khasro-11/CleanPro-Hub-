import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Bitte geben Sie eine gültige E-Mail-Adresse ein."),
  password: z.string().min(8, "Passwort muss mindestens 8 Zeichen lang sein."),
});

export type LoginInput = z.infer<typeof loginSchema>;
