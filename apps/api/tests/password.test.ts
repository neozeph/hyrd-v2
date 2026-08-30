import { describe, expect, it } from "vitest";

import { hashPassword, verifyPassword } from "../src/modules/auth/password.js";

describe("password utilities", () => {
  it("hashes and verifies a password", async () => {
    const passwordHash = await hashPassword("CorrectHorseBatteryStaple123!");

    await expect(
      verifyPassword("CorrectHorseBatteryStaple123!", passwordHash),
    ).resolves.toBe(true);
  });

  it("rejects an incorrect password", async () => {
    const passwordHash = await hashPassword("CorrectPassword123!");

    await expect(
      verifyPassword("IncorrectPassword123!", passwordHash),
    ).resolves.toBe(false);
  });

  it("uses a unique salt for each hash", async () => {
    const firstHash = await hashPassword("SamePassword123!");

    const secondHash = await hashPassword("SamePassword123!");

    expect(firstHash).not.toBe(secondHash);
  });

  it("rejects a malformed stored hash", async () => {
    await expect(
      verifyPassword("Password123!", "not-a-valid-password-hash"),
    ).resolves.toBe(false);
  });
});
