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

const emptyStats = {
  total: 0,
  active: 0,
  interviews: 0,
  offers: 0,
  countsByStatus: {
    saved: 0,
    applied: 0,
    screening: 0,
    assessment: 0,
    interview: 0,
    offer: 0,
    rejected: 0,
    withdrawn: 0,
  },
};

const emptyList = {
  data: [],
  pagination: {
    page: 1,
    limit: 6,
    total: 0,
    totalPages: 0,
  },
};

function jsonResponse(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
}

function mockFetch(...responses: Response[]) {
  const queuedResponses = [...responses];
  const fetchMock = vi.fn((url: string) => {
    if (url.endsWith("/api/auth/csrf")) {
      return Promise.resolve(jsonResponse({ csrfToken: "csrf-token" }));
    }

    return Promise.resolve(queuedResponses.shift() ?? jsonResponse({}));
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
    const fetchMock = mockFetch(
      jsonResponse({ user: testUser }),
      jsonResponse(emptyStats),
      jsonResponse(emptyList),
    );

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
      jsonResponse(emptyList),
      jsonResponse(emptyStats),
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
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3000/api/auth/login",
      expect.objectContaining({
        body: JSON.stringify({
          email: "josef@example.com",
          password: "StrongPassword123!",
        }),
        credentials: "include",
        headers: expect.objectContaining({
          "X-CSRF-Token": "csrf-token",
        }),
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

  it("shows the registration password guidance", async () => {
    mockFetch(jsonResponse({ error: "Authentication required" }, { status: 401 }));

    renderApp({ initialEntries: ["/register"] });

    expect(await screen.findByText("Use at least 12 characters.")).not.toBeNull();
  });

  it("rejects short registration passwords before sending an API request", async () => {
    const fetchMock = mockFetch(
      jsonResponse({ error: "Authentication required" }, { status: 401 }),
    );
    const user = userEvent.setup();

    renderApp({ initialEntries: ["/register"] });

    await screen.findByRole("heading", { name: "Create your HYRD workspace" });

    await user.type(screen.getByLabelText("Name"), "Josef Soriente");
    await user.type(screen.getByLabelText("Email"), "josef@example.com");
    await user.type(screen.getByLabelText("Password"), "short");
    await user.type(screen.getByLabelText("Confirm password"), "short");
    await user.click(screen.getByRole("button", { name: "Create account" }));

    expect(await screen.findAllByText("Use at least 12 characters.")).toHaveLength(2);
    expect(screen.getByLabelText("Password").getAttribute("aria-invalid")).toBe(
      "true",
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("clears password validation errors when the user corrects the password", async () => {
    mockFetch(jsonResponse({ error: "Authentication required" }, { status: 401 }));
    const user = userEvent.setup();

    renderApp({ initialEntries: ["/register"] });

    await screen.findByRole("heading", { name: "Create your HYRD workspace" });

    await user.type(screen.getByLabelText("Name"), "Josef Soriente");
    await user.type(screen.getByLabelText("Email"), "josef@example.com");
    await user.type(screen.getByLabelText("Password"), "short");
    await user.type(screen.getByLabelText("Confirm password"), "short");
    await user.click(screen.getByRole("button", { name: "Create account" }));

    expect(await screen.findAllByText("Use at least 12 characters.")).toHaveLength(2);

    await user.clear(screen.getByLabelText("Password"));
    await user.type(screen.getByLabelText("Password"), "LongEnoughPassword");

    expect(screen.getAllByText("Use at least 12 characters.")).toHaveLength(1);
    expect(screen.getByLabelText("Password").getAttribute("aria-invalid")).toBe(
      "false",
    );
  });

  it("maps backend password field errors under the password field", async () => {
    mockFetch(
      jsonResponse({ error: "Authentication required" }, { status: 401 }),
      jsonResponse(
        {
          error: "Invalid registration data",
          details: {
            formErrors: [],
            fieldErrors: {
              password: ["Password must contain at least 12 characters"],
            },
          },
        },
        { status: 400 },
      ),
    );
    const user = userEvent.setup();

    renderApp({ initialEntries: ["/register"] });

    await screen.findByRole("heading", { name: "Create your HYRD workspace" });

    await user.type(screen.getByLabelText("Name"), "Josef Soriente");
    await user.type(screen.getByLabelText("Email"), "josef@example.com");
    await user.type(screen.getByLabelText("Password"), "StrongPassword123!");
    await user.type(screen.getByLabelText("Confirm password"), "StrongPassword123!");
    await user.click(screen.getByRole("button", { name: "Create account" }));

    expect(
      await screen.findByText("Password must contain at least 12 characters"),
    ).not.toBeNull();
    expect(screen.queryByText("Invalid registration data")).toBeNull();
  });

  it("maps backend email field errors under the email field", async () => {
    mockFetch(
      jsonResponse({ error: "Authentication required" }, { status: 401 }),
      jsonResponse(
        {
          error: "Invalid registration data",
          details: {
            formErrors: [],
            fieldErrors: {
              email: ["Enter a valid email address"],
            },
          },
        },
        { status: 400 },
      ),
    );
    const user = userEvent.setup();

    renderApp({ initialEntries: ["/register"] });

    await screen.findByRole("heading", { name: "Create your HYRD workspace" });

    await user.type(screen.getByLabelText("Name"), "Josef Soriente");
    await user.type(screen.getByLabelText("Email"), "josef@example.com");
    await user.type(screen.getByLabelText("Password"), "StrongPassword123!");
    await user.type(screen.getByLabelText("Confirm password"), "StrongPassword123!");
    await user.click(screen.getByRole("button", { name: "Create account" }));

    expect(await screen.findByText("Enter a valid email address")).not.toBeNull();
    expect(screen.queryByText("Invalid registration data")).toBeNull();
  });

  it("keeps unknown registration errors at form level", async () => {
    mockFetch(
      jsonResponse({ error: "Authentication required" }, { status: 401 }),
      jsonResponse({ error: "Unable to create your account" }, { status: 500 }),
    );
    const user = userEvent.setup();

    renderApp({ initialEntries: ["/register"] });

    await screen.findByRole("heading", { name: "Create your HYRD workspace" });

    await user.type(screen.getByLabelText("Name"), "Josef Soriente");
    await user.type(screen.getByLabelText("Email"), "josef@example.com");
    await user.type(screen.getByLabelText("Password"), "StrongPassword123!");
    await user.type(screen.getByLabelText("Confirm password"), "StrongPassword123!");
    await user.click(screen.getByRole("button", { name: "Create account" }));

    expect(await screen.findByText("Unable to create your account")).not.toBeNull();
  });

  it("registers successfully with valid registration values", async () => {
    const fetchMock = mockFetch(
      jsonResponse({ error: "Authentication required" }, { status: 401 }),
      jsonResponse({ user: testUser }, { status: 201 }),
      jsonResponse(emptyStats),
      jsonResponse(emptyList),
    );
    const user = userEvent.setup();

    renderApp({ initialEntries: ["/register"] });

    await screen.findByRole("heading", { name: "Create your HYRD workspace" });

    await user.type(screen.getByLabelText("Name"), "Josef Soriente");
    await user.type(screen.getByLabelText("Email"), "josef@example.com");
    await user.type(screen.getByLabelText("Password"), "StrongPassword123!");
    await user.type(screen.getByLabelText("Confirm password"), "StrongPassword123!");
    await user.click(screen.getByRole("button", { name: "Create account" }));

    expect(await screen.findByRole("heading", { name: "Overview" })).not.toBeNull();
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3000/api/auth/register",
      expect.objectContaining({
        body: JSON.stringify({
          email: "josef@example.com",
          name: "Josef Soriente",
          password: "StrongPassword123!",
        }),
        method: "POST",
      }),
    );
  });

  it("updates the password strength indicator while typing", async () => {
    mockFetch(jsonResponse({ error: "Authentication required" }, { status: 401 }));
    const user = userEvent.setup();

    renderApp({ initialEntries: ["/register"] });

    await screen.findByRole("heading", { name: "Create your HYRD workspace" });

    expect(screen.queryByRole("progressbar", { name: /password strength/i })).toBeNull();

    await user.type(screen.getByLabelText("Password"), "short");

    const weakMeter = screen.getByRole("progressbar", {
      name: "Password strength: Weak",
    });
    expect(weakMeter.getAttribute("aria-valuemin")).toBe("0");
    expect(weakMeter.getAttribute("aria-valuemax")).toBe("100");
    expect(weakMeter.getAttribute("aria-valuenow")).not.toBeNull();

    await user.clear(screen.getByLabelText("Password"));
    await user.type(screen.getByLabelText("Password"), "orchid copper meadow river");

    expect(
      screen.getByRole("progressbar", { name: "Password strength: Strong" }),
    ).not.toBeNull();
  });

  it("does not send or log passwords while showing strength guidance", async () => {
    const fetchMock = mockFetch(
      jsonResponse({ error: "Authentication required" }, { status: 401 }),
    );
    const consoleLog = vi.spyOn(console, "log").mockImplementation(() => undefined);
    const consoleWarn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const user = userEvent.setup();

    renderApp({ initialEntries: ["/register"] });

    await screen.findByRole("heading", { name: "Create your HYRD workspace" });

    await user.type(screen.getByLabelText("Password"), "SecretPassphrase123!");

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(consoleLog).not.toHaveBeenCalled();
    expect(consoleWarn).not.toHaveBeenCalled();
    expect(consoleError).not.toHaveBeenCalled();
  });

  it("logs out and clears protected content", async () => {
    mockFetch(
      jsonResponse({ user: testUser }),
      jsonResponse(emptyStats),
      jsonResponse(emptyList),
      new Response(null, { status: 204 }),
    );
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
