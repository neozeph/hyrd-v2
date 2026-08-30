import { describe, expect, it } from "vitest";

import {
  createSessionToken,
  hashSessionToken,
} from "../src/modules/auth/session-token.js";

describe("session-token utilities", () => {
  it("creates unique session tokens", () => {
    const firstToken = createSessionToken();
    const secondToken = createSessionToken();

    expect(firstToken).not.toBe(secondToken);
    expect(firstToken.length).toBeGreaterThan(30);
  });

  it("hashes tokens consistently", () => {
    const token = createSessionToken();

    expect(hashSessionToken(token)).toBe(hashSessionToken(token));

    expect(hashSessionToken(token)).toHaveLength(64);
  });
});
