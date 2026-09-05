import { describe, expect, it } from "vitest";

import { getPasswordStrength } from "./password-strength";

describe("getPasswordStrength", () => {
  it("rates passwords shorter than the registration minimum as weak", () => {
    expect(getPasswordStrength({ password: "Short1!" }).rating).toBe("Weak");
  });

  it("does not rate predictable passwords as strong", () => {
    expect(getPasswordStrength({ password: "Password123!" }).rating).not.toBe(
      "Strong",
    );
  });

  it("penalizes repeated-character passwords", () => {
    const repeated = getPasswordStrength({
      password: "aaaaaaaaaaaaaaaaaaaa!",
    });
    const varied = getPasswordStrength({
      password: "orchid copper meadow river",
    });

    expect(repeated.score).toBeLessThan(varied.score);
  });

  it("penalizes passwords containing the user's name", () => {
    const withoutName = getPasswordStrength({
      name: "Josef Soriente",
      password: "orchid copper meadow river",
    });
    const withName = getPasswordStrength({
      name: "Josef Soriente",
      password: "Josef copper meadow river",
    });

    expect(withName.score).toBeLessThan(withoutName.score);
  });

  it("penalizes passwords containing the email local part", () => {
    const withoutEmail = getPasswordStrength({
      email: "josef@example.com",
      password: "orchid copper meadow river",
    });
    const withEmail = getPasswordStrength({
      email: "josef@example.com",
      password: "josef copper meadow river",
    });

    expect(withEmail.score).toBeLessThan(withoutEmail.score);
  });

  it("gives a long unpredictable passphrase a higher score", () => {
    const predictable = getPasswordStrength({ password: "Password123!" });
    const passphrase = getPasswordStrength({
      password: "orchid copper meadow river lantern",
    });

    expect(passphrase.score).toBeGreaterThan(predictable.score);
    expect(passphrase.rating).toBe("Strong");
  });
});
