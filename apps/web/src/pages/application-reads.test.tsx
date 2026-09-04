import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { renderApp } from "../test/auth-test-utils";
import type { ApplicationListResponse, ApplicationStats } from "../types/application";

const testUser = {
  id: "user-1",
  email: "reader@example.com",
  name: "Reader User",
  createdAt: "2026-09-03T00:00:00.000Z",
};

const baseStats: ApplicationStats = {
  total: 2,
  active: 1,
  interviews: 1,
  offers: 0,
  countsByStatus: {
    saved: 0,
    applied: 0,
    screening: 0,
    assessment: 0,
    interview: 1,
    offer: 0,
    rejected: 1,
    withdrawn: 0,
  },
};

const emptyStats: ApplicationStats = {
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

const listResponse: ApplicationListResponse = {
  data: [
    {
      id: "app-1",
      company: "Marlow Systems",
      position: "Frontend Engineer",
      status: "interview",
      location: "Austin, TX",
      appliedAt: "2026-08-22T00:00:00.000Z",
      createdAt: "2026-08-22T00:00:00.000Z",
      updatedAt: "2026-09-01T00:00:00.000Z",
    },
  ],
  pagination: {
    page: 1,
    limit: 6,
    total: 8,
    totalPages: 2,
  },
};

function jsonResponse(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
}

function mockFetch(...responses: Response[]) {
  const fetchMock = vi.fn();
  for (const response of responses) {
    fetchMock.mockResolvedValueOnce(response);
  }
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("application reads", () => {
  beforeEach(() => {
    vi.stubEnv("VITE_API_URL", "http://localhost:3000");
  });

  it("shows dashboard loading placeholders while application reads load", async () => {
    const pending = new Promise<Response>(() => undefined);
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse({ user: testUser }))
      .mockReturnValue(pending);
    vi.stubGlobal("fetch", fetchMock);

    renderApp({ initialEntries: ["/dashboard"] });

    expect(await screen.findByLabelText("Loading application summary")).not.toBeNull();
  });

  it("shows dashboard statistics and recent applications from the API", async () => {
    mockFetch(
      jsonResponse({ user: testUser }),
      jsonResponse(baseStats),
      jsonResponse(listResponse),
    );

    renderApp({ initialEntries: ["/dashboard"] });

    expect(await screen.findByText("Total applications")).not.toBeNull();
    expect(screen.getByText("Active applications")).not.toBeNull();
    expect(screen.getByText("Frontend Engineer")).not.toBeNull();
    expect(screen.getByText("Marlow Systems")).not.toBeNull();
  });

  it("shows the empty dashboard state without fake records", async () => {
    mockFetch(
      jsonResponse({ user: testUser }),
      jsonResponse(emptyStats),
      jsonResponse({
        data: [],
        pagination: { page: 1, limit: 4, total: 0, totalPages: 0 },
      }),
    );

    renderApp({ initialEntries: ["/dashboard"] });

    expect(await screen.findByText("No applications yet")).not.toBeNull();
    expect(screen.queryByText("Marlow Systems")).toBeNull();
  });

  it("shows dashboard errors with a retry action", async () => {
    const fetchMock = mockFetch(
      jsonResponse({ user: testUser }),
      jsonResponse({ error: "Stats unavailable" }, { status: 500 }),
      jsonResponse(listResponse),
      jsonResponse(emptyStats),
      jsonResponse({
        data: [],
        pagination: { page: 1, limit: 4, total: 0, totalPages: 0 },
      }),
    );
    const user = userEvent.setup();

    renderApp({ initialEntries: ["/dashboard"] });

    expect(await screen.findByText("Applications could not load")).not.toBeNull();
    await user.click(screen.getByRole("button", { name: "Retry" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "http://localhost:3000/api/applications/stats",
        expect.objectContaining({ credentials: "include" }),
      );
    });
  });

  it("loads applications and renders pagination controls", async () => {
    mockFetch(
      jsonResponse({ user: testUser }),
      jsonResponse(listResponse),
      jsonResponse(baseStats),
    );

    renderApp({ initialEntries: ["/applications"] });

    expect(await screen.findByText("Frontend Engineer")).not.toBeNull();
    expect(screen.getByText("Showing 1-6 of 8")).not.toBeNull();
    expect(screen.getByRole<HTMLButtonElement>("button", { name: "Next" }).disabled).toBe(
      false,
    );
  });

  it("maps search, status, closed filter, sorting, and pagination to API queries", async () => {
    const fetchMock = mockFetch(
      jsonResponse({ user: testUser }),
      jsonResponse(listResponse),
      jsonResponse(baseStats),
      jsonResponse({ ...listResponse, pagination: { ...listResponse.pagination, page: 2 } }),
      jsonResponse(listResponse),
      jsonResponse(listResponse),
      jsonResponse(listResponse),
    );
    const user = userEvent.setup();

    renderApp({ initialEntries: ["/applications"] });

    await screen.findByText("Frontend Engineer");
    await user.click(screen.getByRole("button", { name: "Next" }));
    await user.type(screen.getByPlaceholderText("Search role, company, location"), "design");
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining("search=design"),
        expect.objectContaining({ credentials: "include" }),
      );
    });

    await user.click(screen.getByRole("tab", { name: /Interview/ }));
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining("status=interview"),
        expect.objectContaining({ credentials: "include" }),
      );
    });

    await user.click(screen.getByRole("tab", { name: /Closed/ }));
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining("status=rejected&status=withdrawn"),
        expect.objectContaining({ credentials: "include" }),
      );
    });

    await user.selectOptions(screen.getByLabelText("Sort applications"), "company-asc");
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining("sortBy=company&sortOrder=asc"),
        expect.objectContaining({ credentials: "include" }),
      );
    });
  });

  it("shows empty filter state and clears filters", async () => {
    mockFetch(
      jsonResponse({ user: testUser }),
      jsonResponse({
        data: [],
        pagination: { page: 1, limit: 6, total: 0, totalPages: 0 },
      }),
      jsonResponse(baseStats),
      jsonResponse(listResponse),
    );
    const user = userEvent.setup();

    renderApp({ initialEntries: ["/applications"] });

    const searchInput = await screen.findByPlaceholderText(
      "Search role, company, location",
    );
    await user.type(searchInput, "none");
    expect(await screen.findByText("No applications match")).not.toBeNull();

    const emptyState = screen.getByText("No applications match").closest("section");
    expect(emptyState).not.toBeNull();
    await user.click(within(emptyState as HTMLElement).getByRole("button", { name: "Clear filters" }));

    await waitFor(() => {
      expect(
        screen.getByPlaceholderText<HTMLInputElement>(
          "Search role, company, location",
        ).value,
      ).toBe("");
    });
  });

  it("redirects to login when an application read returns 401", async () => {
    mockFetch(
      jsonResponse({ user: testUser }),
      jsonResponse({ error: "Invalid or expired session" }, { status: 401 }),
      jsonResponse(emptyStats),
      new Response(null, { status: 204 }),
    );

    renderApp({ initialEntries: ["/applications"] });

    expect(
      await screen.findByRole("heading", { name: "Log in to your application tracker" }),
    ).not.toBeNull();
  });
});
