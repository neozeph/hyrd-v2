import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { renderApp } from "../test/auth-test-utils";

const testUser = {
  id: "user-1",
  email: "josef@example.com",
  name: "Josef Soriente",
  createdAt: "2026-09-03T00:00:00.000Z",
};

function jsonResponse(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
}

function mockFetch(...responses: Response[]) {
  const fetchMock = vi.fn();
  responses.forEach((response) => {
    fetchMock.mockResolvedValueOnce(response);
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("authentication flow", () => {
  beforeEach(() => {
    vi.stubEnv("VITE_API_URL", "http://localhost:3000");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("restores an existing session before showing protected content", async () => {
    const fetchMock = mockFetch(jsonResponse({ user: testUser }));

    renderApp({ initialEntries: ["/dashboard"] });

    expect(screen.getByText("Restoring your HYRD session...")).not.toBeNull();

    expect(await screen.findByRole("heading", { name: "Overview" })).not.toBeNull();
    expect(screen.getByText("Josef Soriente")).not.toBeNull();
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3000/api/auth/me",
      expect.objectContaining({ credentials: "include" }),
    );
  });

  it("redirects logged-out users away from protected routes", async () => {
    mockFetch(jsonResponse({ error: "Authentication required" }, { status: 401 }));

    renderApp({ initialEntries: ["/applications"] });

    expect(
      await screen.findByRole("heading", { name: "Log in to your application tracker" }),
    ).not.toBeNull();
  });

  it("logs in and redirects to the originally requested route", async () => {
    const fetchMock = mockFetch(
      jsonResponse({ error: "Authentication required" }, { status: 401 }),
      jsonResponse({ user: testUser }),
    );
    const user = userEvent.setup();

    renderApp({ initialEntries: ["/applications"] });

    await screen.findByRole("heading", {
      name: "Log in to your application tracker",
    });

    await user.type(screen.getByLabelText("Email"), "josef@example.com");
    await user.type(screen.getByLabelText("Password"), "StrongPassword123!");
    await user.click(screen.getByRole("button", { name: "Log in" }));

    expect(await screen.findByRole("heading", { name: "Applications" })).not.toBeNull();
    expect(fetchMock).toHaveBeenLastCalledWith(
      "http://localhost:3000/api/auth/login",
      expect.objectContaining({
        body: JSON.stringify({
          email: "josef@example.com",
          password: "StrongPassword123!",
        }),
        credentials: "include",
        method: "POST",
      }),
    );
  });

  it("shows login failures and clears the password field", async () => {
    mockFetch(
      jsonResponse({ error: "Authentication required" }, { status: 401 }),
      jsonResponse(
        { code: "INVALID_CREDENTIALS", error: "Invalid email or password" },
        { status: 401 },
      ),
    );
    const user = userEvent.setup();

    renderApp({ initialEntries: ["/login"] });

    await screen.findByRole("heading", {
      name: "Log in to your application tracker",
    });

    await user.type(screen.getByLabelText("Email"), "josef@example.com");
    await user.type(screen.getByLabelText("Password"), "wrong-password");
    await user.click(screen.getByRole("button", { name: "Log in" }));

    expect(await screen.findByText("Invalid email or password")).not.toBeNull();
    expect((screen.getByLabelText("Email") as HTMLInputElement).value).toBe(
      "josef@example.com",
    );
    expect((screen.getByLabelText("Password") as HTMLInputElement).value).toBe("");
  });

  it("blocks registration when passwords do not match", async () => {
    const fetchMock = mockFetch(
      jsonResponse({ error: "Authentication required" }, { status: 401 }),
    );
    const user = userEvent.setup();

    renderApp({ initialEntries: ["/register"] });

    await screen.findByRole("heading", { name: "Create your HYRD workspace" });

    await user.type(screen.getByLabelText("Name"), "Josef Soriente");
    await user.type(screen.getByLabelText("Email"), "josef@example.com");
    await user.type(screen.getByLabelText("Password"), "StrongPassword123!");
    await user.type(screen.getByLabelText("Confirm password"), "DifferentPassword123!");
    await user.click(screen.getByRole("button", { name: "Create account" }));

    expect(await screen.findByText("Passwords do not match.")).not.toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("logs out and clears protected content", async () => {
    mockFetch(jsonResponse({ user: testUser }), new Response(null, { status: 204 }));
    const user = userEvent.setup();

    renderApp({ initialEntries: ["/dashboard"] });

    await screen.findByRole("heading", { name: "Overview" });
    await user.click(screen.getByRole("button", { name: "Logout" }));

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "Log in to your application tracker" }),
      ).not.toBeNull();
    });
  });
});
