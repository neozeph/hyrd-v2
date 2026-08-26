import { z } from "zod";

import { APPLICATION_STATUSES } from "./application.types.js";

export const applicationIdSchema = z
  .string({
    error: "Application ID must be a valid UUID",
  })
  .uuid("Application ID must be a valid UUID");

export const createApplicationSchema = z
  .object({
    company: z
      .string({ error: "Company is required" })
      .trim()
      .min(1, "Company is required"),

    position: z
      .string({ error: "Position is required" })
      .trim()
      .min(1, "Position is required"),

    status: z
      .enum(APPLICATION_STATUSES, {
        error: "Invalid application status",
      })
      .optional(),
    location: z.string().trim().min(1).optional(),
    jobUrl: z.string().url("Job URL must be valid").optional(),
    notes: z.string().trim().optional(),
    appliedAt: z.string().datetime("Applied date must be valid").optional(),
  })
  .strict();

export const updateApplicationSchema = createApplicationSchema
  .partial()
  .extend({
    company: z
      .string({ error: "Company cannot be empty" })
      .trim()
      .min(1, "Company cannot be empty")
      .optional(),

    position: z
      .string({ error: "Position cannot be empty" })
      .trim()
      .min(1, "Position cannot be empty")
      .optional(),
  })
  .refine((input) => Object.keys(input).length > 0, {
    message: "At least one field is required",
  });
