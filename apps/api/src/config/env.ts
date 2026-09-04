import "dotenv/config";

import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),

  PORT: z.coerce.number().int().min(1).max(65535).default(3000),

  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),

  CLIENT_ORIGIN: z.string().url().default("http://localhost:5173"),

  TRUST_PROXY: z.enum(["false", "loopback", "1"]).default("false"),

  COOKIE_SAME_SITE: z.enum(["lax", "strict", "none"]).optional(),

  CSRF_SECRET: z.string().min(32).optional(),

  GENERAL_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(300),

  AUTH_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(20),

  LOG_LEVEL: z
    .enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"])
    .default("info"),
}).superRefine((value, context) => {
  if (value.NODE_ENV === "production" && value.CSRF_SECRET === undefined) {
    context.addIssue({
      code: "custom",
      message: "CSRF_SECRET is required in production",
      path: ["CSRF_SECRET"],
    });
  }

  if (value.NODE_ENV === "production" && value.COOKIE_SAME_SITE === "none") {
    return;
  }
});

const result = envSchema.safeParse(process.env);

if (!result.success) {
  console.error(
    "Invalid environment configuration:",
    result.error.flatten().fieldErrors,
  );

  throw new Error("Invalid environment configuration");
}

export const env = result.data;

export const cookieSameSite =
  env.COOKIE_SAME_SITE ?? (env.NODE_ENV === "production" ? "none" : "lax");

export const csrfSecret =
  env.CSRF_SECRET ?? "development-only-csrf-secret-change-for-production";

export const trustProxy =
  env.TRUST_PROXY === "false"
    ? false
    : env.TRUST_PROXY === "1"
      ? 1
      : env.TRUST_PROXY;
