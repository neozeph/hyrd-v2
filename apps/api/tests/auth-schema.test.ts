import { describe, expect, it } from "vitest";

import {
  loginSchema,
  registerSchema,
} from "../src/modules/auth/auth.schema.js";

describe("authentication schemas", () => {
  it("normalizes registration emails", () => {
    const result = registerSchema.parse({
      email: "  Josef@Example.COM  ",
      password: "StrongPassword123!",
    });

    expect(result.email).toBe("josef@example.com");
  });

  it("rejects invalid registration emails", () => {
    const result = registerSchema.safeParse({
      email: "not-an-email",
      password: "StrongPassword123!",
    });

    expect(result.success).toBe(false);
  });

  it("rejects short registration passwords", () => {
    const result = registerSchema.safeParse({
      email: "josef@example.com",
      password: "short",
    });

    expect(result.success).toBe(false);
  });

  it("rejects unexpected registration fields", () => {
    const result = registerSchema.safeParse({
      email: "josef@example.com",
      password: "StrongPassword123!",
      role: "admin",
    });

    expect(result.success).toBe(false);
  });

  it("accepts valid login credentials", () => {
    const result = loginSchema.parse({
      email: "JOSEF@example.com",
      password: "StrongPassword123!",
    });

    expect(result.email).toBe("josef@example.com");
  });
});
