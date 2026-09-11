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

function mockFetch(response: Response) {
  const fetchMock = vi.fn(() => Promise.resolve(response));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("landing page", () => {
  beforeEach(() => {
    vi.stubEnv("VITE_API_URL", "http://localhost:3000");
    vi.stubGlobal(
      "matchMedia",
      vi.fn(() => ({
        addEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
        matches: false,
        media: "",
        onchange: null,
        removeEventListener: vi.fn(),
      })),
    );
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("renders publicly at the root route with essential landmarks and headings", async () => {
    mockFetch(jsonResponse({ error: "Authentication required" }, { status: 401 }));

    renderApp({ initialEntries: ["/"] });

    expect(
      await screen.findByRole("heading", {
        name: "Your job search deserves a system.",
      }),
    ).not.toBeNull();
    expect(
      screen.getByRole("navigation", { name: "Public navigation" }),
    ).not.toBeNull();
    expect(screen.getAllByRole("link", { name: "HYRD home" }).length).toBeGreaterThan(
      0,
    );
    expect(screen.getAllByText("HYRD").length).toBeGreaterThan(0);
    expect(screen.getByRole("contentinfo")).not.toBeNull();
    expect(
      screen.getByRole("heading", { name: "Four practical moves." }),
    ).not.toBeNull();
    expect(
      screen.getByRole("img", { name: /stylized HYRD workspace/i }),
    ).not.toBeNull();
    expect(screen.getByRole("link", { name: "Privacy" }).getAttribute("href")).toBe(
      "/privacy",
    );
    expect(
      screen.getByRole("link", { name: "Terms & Conditions" }).getAttribute("href"),
    ).toBe("/terms");
  });

  it("points logged-out landing CTAs to registration and login", async () => {
    mockFetch(jsonResponse({ error: "Authentication required" }, { status: 401 }));

    renderApp({ initialEntries: ["/"] });

    await screen.findByRole("heading", {
      name: "Your job search deserves a system.",
    });

    expect(
      screen.getAllByRole("link", { name: "Get HYRD" })[0]?.getAttribute("href"),
    ).toBe("/register");
    expect(
      screen.getAllByRole("link", { name: "Sign in" })[0]?.getAttribute("href"),
    ).toBe("/login");
  });

  it("points authenticated landing CTAs to the dashboard without redirecting", async () => {
    mockFetch(jsonResponse({ user: testUser }));

    renderApp({ initialEntries: ["/"] });

    await waitFor(() => {
      expect(
        screen.getAllByRole("link", { name: "Dashboard" })[0]?.getAttribute("href"),
      ).toBe("/dashboard");
    });
    expect(
      screen.getByRole("heading", { name: "Your job search deserves a system." }),
    ).not.toBeNull();
  });

  it("keeps protected routes unavailable to logged-out users", async () => {
    mockFetch(jsonResponse({ error: "Authentication required" }, { status: 401 }));

    renderApp({ initialEntries: ["/dashboard"] });

    expect(
      await screen.findByRole("heading", {
        name: "Welcome back",
      }),
    ).not.toBeNull();
  });

  it("opens and closes the mobile navigation", async () => {
    mockFetch(jsonResponse({ error: "Authentication required" }, { status: 401 }));
    const user = userEvent.setup();

    renderApp({ initialEntries: ["/"] });

    await screen.findByRole("heading", {
      name: "Your job search deserves a system.",
    });

    const toggle = screen.getByRole("button", { name: "Open navigation" });
    expect(toggle.getAttribute("aria-expanded")).toBe("false");

    await user.click(toggle);

    expect(
      screen.getByRole("button", { name: "Close navigation" }),
    ).not.toBeNull();
    expect(
      screen
        .getByRole("button", { name: "Close navigation" })
        .getAttribute("aria-expanded"),
    ).toBe("true");

    await user.click(screen.getByRole("button", { name: "Close navigation" }));

    expect(
      screen
        .getByRole("button", { name: "Open navigation" })
        .getAttribute("aria-expanded"),
    ).toBe("false");
  });

  it("renders the privacy and terms routes without requiring authentication", async () => {
    mockFetch(jsonResponse({ error: "Authentication required" }, { status: 401 }));

    renderApp({ initialEntries: ["/privacy"] });

    expect(await screen.findByRole("heading", { name: "Privacy Policy" })).not.toBeNull();
    expect(screen.getByText(/Draft structure only/i)).not.toBeNull();
  });

  it("renders the terms route without requiring authentication", async () => {
    mockFetch(jsonResponse({ error: "Authentication required" }, { status: 401 }));

    renderApp({ initialEntries: ["/terms"] });

    expect(
      await screen.findByRole("heading", { name: "Terms & Conditions" }),
    ).not.toBeNull();
    expect(screen.getByText(/Draft structure only/i)).not.toBeNull();
  });
});
