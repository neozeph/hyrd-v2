import { z } from "zod";

const emailSchema = z
  .string()
  .trim()
  .email("Enter a valid email address")
  .max(254)
  .transform((email) => email.toLowerCase());

const registrationPasswordSchema = z
  .string()
  .min(12, "Password must contain at least 12 characters")
  .max(128, "Password must contain at most 128 characters");

const loginPasswordSchema = z
  .string()
  .min(1, "Password is required")
  .max(128, "Password must contain at most 128 characters");

export const registerSchema = z
  .object({
    email: emailSchema,
    password: registrationPasswordSchema,
  })
  .strict();

export const loginSchema = z
  .object({
    email: emailSchema,
    password: loginPasswordSchema,
  })
  .strict();

export type RegisterInput = z.infer<typeof registerSchema>;

export type LoginInput = z.infer<typeof loginSchema>;
