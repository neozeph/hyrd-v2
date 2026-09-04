import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { renderApp } from "../test/auth-test-utils";
import type { ApplicationListResponse, ApplicationStats, JobApplication } from "../types/application";

const testUser = {
  id: "user-1",
  email: "crud@example.com",
  name: "Crud User",
  createdAt: "2026-09-03T00:00:00.000Z",
};

const application: JobApplication = {
  id: "app-1",
  company: "Acme Atlas",
  position: "Frontend Engineer",
  status: "applied",
  location: "Remote",
  jobUrl: "https://example.com/job",
  notes: "Initial notes",
  appliedAt: "2026-08-20T00:00:00.000Z",
  createdAt: "2026-08-19T00:00:00.000Z",
  updatedAt: "2026-08-21T00:00:00.000Z",
};

const stats: ApplicationStats = {
  total: 1,
  active: 1,
  interviews: 0,
  offers: 0,
  countsByStatus: {
    saved: 0,
    applied: 1,
    screening: 0,
    assessment: 0,
    interview: 0,
    offer: 0,
    rejected: 0,
    withdrawn: 0,
  },
};

const list: ApplicationListResponse = {
  data: [application],
  pagination: {
    page: 1,
    limit: 6,
    total: 1,
    totalPages: 1,
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

describe("application CRUD UI", () => {
  beforeEach(() => {
    vi.stubEnv("VITE_API_URL", "http://localhost:3000");
  });

  it("opens application details from a card", async () => {
    mockFetch(jsonResponse({ user: testUser }), jsonResponse(list), jsonResponse(stats), jsonResponse(application));

    renderApp({ initialEntries: ["/applications"] });

    await screen.findByText("Frontend Engineer");
    await userEvent.click(screen.getByRole("button", { name: "View details" }));

    expect(await screen.findByRole("dialog", { name: "Application details" })).not.toBeNull();
    expect(screen.getByText("https://example.com/job")).not.toBeNull();
  });

  it("creates an application and sends only supported non-empty fields", async () => {
    const fetchMock = mockFetch(
      jsonResponse({ user: testUser }),
      jsonResponse({ data: [], pagination: { page: 1, limit: 6, total: 0, totalPages: 0 } }),
      jsonResponse({ ...stats, total: 0, active: 0, countsByStatus: { ...stats.countsByStatus, applied: 0 } }),
      jsonResponse(application, { status: 201 }),
      jsonResponse(list),
      jsonResponse(stats),
      jsonResponse(list),
    );
    const user = userEvent.setup();

    renderApp({ initialEntries: ["/applications"] });

    await user.click(await screen.findByRole("button", { name: "Add application" }));
    await user.type(screen.getByLabelText("Company"), "Acme Atlas");
    await user.type(screen.getByLabelText("Position"), "Frontend Engineer");
    await user.type(screen.getByLabelText("Applied date"), "2026-08-20");
    await user.click(screen.getByRole("button", { name: "Create application" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "http://localhost:3000/api/applications",
        expect.objectContaining({
          body: JSON.stringify({
            company: "Acme Atlas",
            position: "Frontend Engineer",
            status: "saved",
            appliedAt: "2026-08-20T00:00:00.000Z",
          }),
          method: "POST",
        }),
      );
    });
  });

  it("keeps create values after a failed request", async () => {
    mockFetch(
      jsonResponse({ user: testUser }),
      jsonResponse({ data: [], pagination: { page: 1, limit: 6, total: 0, totalPages: 0 } }),
      jsonResponse({ ...stats, total: 0, active: 0, countsByStatus: { ...stats.countsByStatus, applied: 0 } }),
      jsonResponse({ error: "Job URL must be valid" }, { status: 400 }),
    );
    const user = userEvent.setup();

    renderApp({ initialEntries: ["/applications"] });

    await user.click(await screen.findByRole("button", { name: "Add application" }));
    await user.type(screen.getByLabelText("Company"), "Acme Atlas");
    await user.type(screen.getByLabelText("Position"), "Frontend Engineer");
    await user.type(screen.getByLabelText("Job URL"), "ftp://example.com/job");
    await user.click(screen.getByRole("button", { name: "Create application" }));

    expect(await screen.findByText("Job URL must be valid.")).not.toBeNull();
    expect(screen.getByLabelText<HTMLInputElement>("Company").value).toBe("Acme Atlas");
  });

  it("edits an application and prevents empty updates", async () => {
    const updated = { ...application, status: "interview" as const, location: undefined, updatedAt: "2026-08-22T00:00:00.000Z" };
    const fetchMock = mockFetch(
      jsonResponse({ user: testUser }),
      jsonResponse(list),
      jsonResponse(stats),
      jsonResponse(application),
      jsonResponse(updated),
      jsonResponse(list),
      jsonResponse(stats),
      jsonResponse(list),
    );
    const user = userEvent.setup();

    renderApp({ initialEntries: ["/applications"] });

    await user.click(await screen.findByRole("button", { name: "View details" }));
    await user.click(await screen.findByRole("button", { name: "Edit" }));
    expect(screen.getByLabelText<HTMLInputElement>("Company").value).toBe("Acme Atlas");

    await user.click(screen.getByRole("button", { name: "Save changes" }));
    expect(await screen.findByText("Change at least one field before saving.")).not.toBeNull();

    await user.selectOptions(screen.getByLabelText("Status"), "interview");
    await user.clear(screen.getByLabelText("Location"));
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "http://localhost:3000/api/applications/app-1",
        expect.objectContaining({
          body: JSON.stringify({ status: "interview", location: null }),
          method: "PATCH",
        }),
      );
    });
  });

  it("cancels, confirms, and reports failed deletion", async () => {
    const fetchMock = mockFetch(
      jsonResponse({ user: testUser }),
      jsonResponse(list),
      jsonResponse(stats),
      jsonResponse(application),
      jsonResponse({ error: "Delete failed" }, { status: 500 }),
      new Response(null, { status: 204 }),
      jsonResponse({ data: [], pagination: { page: 1, limit: 6, total: 0, totalPages: 0 } }),
      jsonResponse({ ...stats, total: 0, active: 0, countsByStatus: { ...stats.countsByStatus, applied: 0 } }),
      jsonResponse({ data: [], pagination: { page: 1, limit: 4, total: 0, totalPages: 0 } }),
    );
    const user = userEvent.setup();

    renderApp({ initialEntries: ["/applications"] });

    await user.click(await screen.findByRole("button", { name: "View details" }));
    await user.click(await screen.findByRole("button", { name: "Delete" }));
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.getByRole("dialog", { name: "Application details" })).not.toBeNull();

    await user.click(screen.getByRole("button", { name: "Delete" }));
    await user.click(screen.getByRole("button", { name: "Delete application" }));
    expect(await screen.findByText("Delete failed")).not.toBeNull();

    await user.click(screen.getByRole("button", { name: "Delete application" }));
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "http://localhost:3000/api/applications/app-1",
        expect.objectContaining({ method: "DELETE" }),
      );
    });
  });
});
