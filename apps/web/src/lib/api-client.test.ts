import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { apiRequest, clearCsrfToken } from "./api-client";

function jsonResponse(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
}

describe("apiRequest CSRF handling", () => {
  beforeEach(() => {
    clearCsrfToken();
    vi.stubEnv("VITE_API_URL", "http://localhost:3000");
  });

  afterEach(() => {
    clearCsrfToken();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("fetches a CSRF token before unsafe requests and attaches the header", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ csrfToken: "csrf-token" }))
      .mockResolvedValueOnce(jsonResponse({ ok: true }));
    vi.stubGlobal("fetch", fetchMock);

    await apiRequest("/api/auth/login", {
      body: { email: "josef@example.com", password: "StrongPassword123!" },
      method: "POST",
    });

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "http://localhost:3000/api/auth/csrf",
      expect.objectContaining({
        credentials: "include",
        method: "GET",
      }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "http://localhost:3000/api/auth/login",
      expect.objectContaining({
        credentials: "include",
        headers: expect.objectContaining({
          "Content-Type": "application/json",
          "X-CSRF-Token": "csrf-token",
        }),
        method: "POST",
      }),
    );
  });

  it("does not fetch a CSRF token for safe requests", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(jsonResponse({ ok: true }));
    vi.stubGlobal("fetch", fetchMock);

    await apiRequest("/api/auth/me");

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3000/api/auth/me",
      expect.objectContaining({
        credentials: "include",
        method: "GET",
      }),
    );
  });

  it("shares one bootstrap request across concurrent unsafe requests", async () => {
    const fetchMock = vi.fn((url: string) => {
      if (url.endsWith("/api/auth/csrf")) {
        return Promise.resolve(jsonResponse({ csrfToken: "shared-csrf-token" }));
      }

      return Promise.resolve(jsonResponse({ ok: true }));
    });
    vi.stubGlobal("fetch", fetchMock);

    await Promise.all([
      apiRequest("/api/applications", {
        body: { company: "A", position: "Role A" },
        method: "POST",
      }),
      apiRequest("/api/applications", {
        body: { company: "B", position: "Role B" },
        method: "POST",
      }),
    ]);

    const csrfCalls = fetchMock.mock.calls.filter(([url]) =>
      String(url).endsWith("/api/auth/csrf"),
    );

    expect(csrfCalls).toHaveLength(1);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("surfaces CSRF failures as controlled API errors", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ csrfToken: "csrf-token" }))
      .mockResolvedValueOnce(
        jsonResponse(
          { error: "Invalid CSRF token", code: "INVALID_CSRF_TOKEN" },
          { status: 403 },
        ),
      );
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      apiRequest("/api/applications", {
        body: { company: "Acme", position: "Engineer" },
        method: "POST",
      }),
    ).rejects.toMatchObject({
      code: "INVALID_CSRF_TOKEN",
      message: "Invalid CSRF token",
      status: 403,
    });
  });
});
