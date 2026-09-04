import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "../src/lib/prisma.js";
import { app } from "../src/app.js";
import { resetApplications } from "../src/modules/applications/application.repository.js";

const nonexistentApplicationId = "00000000-0000-4000-8000-000000000000";

const TEST_EMAIL = "applications-test@hyrd.dev";

const SECOND_USER_EMAIL = "applications-isolation-test@hyrd.dev";

const STATS_USER_EMAIL = "applications-stats-isolation-test@hyrd.dev";

const TEST_PASSWORD = "StrongPassword123!";

let agent: ReturnType<typeof request.agent>;

async function getCsrfToken(testAgent: ReturnType<typeof request.agent>) {
  const response = await testAgent.get("/api/auth/csrf").expect(200);
  return response.body.csrfToken as string;
}

function attachCsrfToUnsafeRequests(
  testAgent: ReturnType<typeof request.agent>,
  csrfToken: string,
) {
  const unsafeMethods = ["delete", "patch", "post", "put"] as const;

  for (const method of unsafeMethods) {
    const originalMethod = testAgent[method].bind(testAgent);
    testAgent[method] = ((url: string) =>
      originalMethod(url).set("X-CSRF-Token", csrfToken)) as typeof testAgent[typeof method];
  }
}

async function removeTestUsers() {
  await prisma.user.deleteMany({
    where: {
      email: {
        in: [TEST_EMAIL, SECOND_USER_EMAIL, STATS_USER_EMAIL],
      },
    },
  });
}

describe("Applications API", () => {
  beforeAll(async () => {
    await resetApplications();
    await removeTestUsers();

    agent = request.agent(app);
    attachCsrfToUnsafeRequests(agent, await getCsrfToken(agent));

    await agent
      .post("/api/auth/register")
      .send({
        name: "Application Tester",
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      })
      .expect(201);
  });

  beforeEach(async () => {
    await resetApplications();
  });

  afterAll(async () => {
    await resetApplications();
    await removeTestUsers();
  });

  it("rejects unauthenticated requests", async () => {
    const response = await request(app).get("/api/applications");

    expect(response.status).toBe(401);

    expect(response.body).toEqual({
      error: "Authentication required",
    });
  });

  it("returns an empty application list", async () => {
    const response = await agent.get("/api/applications");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      data: [],
      pagination: {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
      },
    });
  });

  it("creates an application", async () => {
    const response = await agent.post("/api/applications").send({
      company: "IBM",
      position: "Consulting Associate",
      status: "applied",
    });

    expect(response.status).toBe(201);

    expect(response.body).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        company: "IBM",
        position: "Consulting Associate",
        status: "applied",
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      }),
    );
  });

  it("rejects an empty company", async () => {
    const response = await agent.post("/api/applications").send({
      company: "",
      position: "Software Developer",
    });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: "Company is required",
    });
  });

  it("rejects an invalid status", async () => {
    const response = await agent.post("/api/applications").send({
      company: "Example Company",
      position: "QA Tester",
      status: "pending",
    });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: "Invalid application status",
    });
  });

  it("retrieves an application by ID", async () => {
    const createResponse = await agent.post("/api/applications").send({
      company: "Accenture",
      position: "Associate Software Engineer",
    });

    const applicationId = createResponse.body.id as string;

    const response = await agent.get(`/api/applications/${applicationId}`);

    expect(response.status).toBe(200);

    expect(response.body).toEqual(
      expect.objectContaining({
        id: applicationId,
        company: "Accenture",
        position: "Associate Software Engineer",
        status: "saved",
      }),
    );
  });

  it("updates an existing application", async () => {
    const createResponse = await agent.post("/api/applications").send({
      company: "PathBuilder",
      position: "QA Analyst",
      status: "applied",
    });

    const applicationId = createResponse.body.id as string;
    const originalCreatedAt = createResponse.body.createdAt as string;

    const response = await agent
      .patch(`/api/applications/${applicationId}`)
      .send({
        status: "interview",
        notes: "Technical interview scheduled.",
      });

    expect(response.status).toBe(200);

    expect(response.body).toEqual(
      expect.objectContaining({
        id: applicationId,
        company: "PathBuilder",
        position: "QA Analyst",
        status: "interview",
        notes: "Technical interview scheduled.",
        createdAt: originalCreatedAt,
        updatedAt: expect.any(String),
      }),
    );
  });

  it("clears optional application fields", async () => {
    const createResponse = await agent.post("/api/applications").send({
      company: "Clearable",
      position: "Optional Fields",
      location: "Remote",
      jobUrl: "https://example.com/job",
      notes: "Initial note",
      appliedAt: "2026-08-20T00:00:00.000Z",
    });

    const applicationId = createResponse.body.id as string;

    const response = await agent
      .patch(`/api/applications/${applicationId}`)
      .send({
        location: null,
        jobUrl: null,
        notes: null,
        appliedAt: null,
      });

    expect(response.status).toBe(200);
    expect(response.body).not.toHaveProperty("location");
    expect(response.body).not.toHaveProperty("jobUrl");
    expect(response.body).not.toHaveProperty("notes");
    expect(response.body).not.toHaveProperty("appliedAt");
  });

  it("deletes an existing application", async () => {
    const createResponse = await agent.post("/api/applications").send({
      company: "IBM",
      position: "Technical Support Specialist",
    });

    const applicationId = createResponse.body.id as string;

    const deleteResponse = await agent.delete(
      `/api/applications/${applicationId}`,
    );

    expect(deleteResponse.status).toBe(204);
    expect(deleteResponse.text).toBe("");

    const getResponse = await agent.get(`/api/applications/${applicationId}`);

    expect(getResponse.status).toBe(404);
    expect(getResponse.body).toEqual({
      error: "Application not found",
    });
  });

  it("rejects a missing position", async () => {
    const response = await agent.post("/api/applications").send({
      company: "IBM",
    });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: "Position is required",
    });
  });

  it("returns 404 when retrieving an unknown application", async () => {
    const response = await agent.get(
      `/api/applications/${nonexistentApplicationId}`,
    );

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      error: "Application not found",
    });
  });

  it("returns 404 when deleting an unknown application", async () => {
    const response = await agent.delete(
      `/api/applications/${nonexistentApplicationId}`,
    );

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      error: "Application not found",
    });
  });

  it("rejects an empty company update", async () => {
    const createResponse = await agent.post("/api/applications").send({
      company: "IBM",
      position: "Software Developer",
    });

    const applicationId = createResponse.body.id as string;

    const response = await agent
      .patch(`/api/applications/${applicationId}`)
      .send({
        company: "",
      });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: "Company cannot be empty",
    });
  });

  it("rejects an invalid status update", async () => {
    const createResponse = await agent.post("/api/applications").send({
      company: "IBM",
      position: "Software Developer",
    });

    const applicationId = createResponse.body.id as string;

    const response = await agent
      .patch(`/api/applications/${applicationId}`)
      .send({
        status: "pending",
      });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: "Invalid application status",
    });
  });

  it("returns 404 when updating an unknown application", async () => {
    const response = await agent
      .patch(`/api/applications/${nonexistentApplicationId}`)
      .send({
        status: "interview",
      });

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      error: "Application not found",
    });
  });

  it("rejects an empty update", async () => {
    const createResponse = await agent.post("/api/applications").send({
      company: "IBM",
      position: "Software Developer",
    });

    const applicationId = createResponse.body.id as string;

    const response = await agent
      .patch(`/api/applications/${applicationId}`)
      .send({});

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: "At least one field is required",
    });
  });

  it("rejects unknown creation fields", async () => {
    const response = await agent.post("/api/applications").send({
      company: "IBM",
      position: "Software Developer",
      unexpectedField: "not allowed",
    });

    expect(response.status).toBe(400);
  });

  it("rejects a malformed application ID", async () => {
    const response = await agent.get("/api/applications/not-a-valid-uuid");

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: "Application ID must be a valid UUID",
    });
  });

  it("searches applications by company or position", async () => {
    await agent.post("/api/applications").send({
      company: "IBM Philippines",
      position: "Technical Support Specialist",
    });

    await agent.post("/api/applications").send({
      company: "Acme Corporation",
      position: "Data Analyst",
    });

    const response = await agent.get("/api/applications?search=ibm");

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0]).toEqual(
      expect.objectContaining({
        company: "IBM Philippines",
      }),
    );
  });

  it("filters applications by status", async () => {
    await agent.post("/api/applications").send({
      company: "IBM",
      position: "Developer",
      status: "interview",
    });

    await agent.post("/api/applications").send({
      company: "Accenture",
      position: "Associate Engineer",
      status: "applied",
    });

    const response = await agent.get("/api/applications?status=interview");

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].status).toBe("interview");
  });

  it("filters applications by repeated statuses", async () => {
    await agent.post("/api/applications").send({
      company: "Rejected Company",
      position: "Rejected Role",
      status: "rejected",
    });

    await agent.post("/api/applications").send({
      company: "Withdrawn Company",
      position: "Withdrawn Role",
      status: "withdrawn",
    });

    await agent.post("/api/applications").send({
      company: "Active Company",
      position: "Active Role",
      status: "applied",
    });

    const response = await agent.get(
      "/api/applications?status=rejected&status=withdrawn",
    );

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(2);
    expect(response.body.data.map((application: { status: string }) => application.status)).toEqual(
      expect.arrayContaining(["rejected", "withdrawn"]),
    );
    expect(response.body.pagination).toMatchObject({
      total: 2,
    });
  });

  it("rejects unauthenticated application stats requests", async () => {
    const response = await request(app).get("/api/applications/stats");

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      error: "Authentication required",
    });
  });

  it("returns current-user application statistics by status", async () => {
    await agent.post("/api/applications").send({
      company: "Saved Company",
      position: "Saved Role",
      status: "saved",
    });

    await agent.post("/api/applications").send({
      company: "Applied Company",
      position: "Applied Role",
      status: "applied",
    });

    await agent.post("/api/applications").send({
      company: "Interview Company",
      position: "Interview Role",
      status: "interview",
    });

    await agent.post("/api/applications").send({
      company: "Offer Company",
      position: "Offer Role",
      status: "offer",
    });

    await agent.post("/api/applications").send({
      company: "Rejected Company",
      position: "Rejected Role",
      status: "rejected",
    });

    await agent.post("/api/applications").send({
      company: "Withdrawn Company",
      position: "Withdrawn Role",
      status: "withdrawn",
    });

    const response = await agent.get("/api/applications/stats");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      total: 6,
      active: 4,
      interviews: 1,
      offers: 1,
      countsByStatus: {
        saved: 1,
        applied: 1,
        screening: 0,
        interview: 1,
        assessment: 0,
        offer: 1,
        rejected: 1,
        withdrawn: 1,
      },
    });
  });

  it("isolates application statistics between users", async () => {
    const secondAgent = request.agent(app);
    attachCsrfToUnsafeRequests(secondAgent, await getCsrfToken(secondAgent));

    await secondAgent
      .post("/api/auth/register")
      .send({
        name: "Second Tester",
        email: STATS_USER_EMAIL,
        password: TEST_PASSWORD,
      })
      .expect(201);

    await agent.post("/api/applications").send({
      company: "First User Company",
      position: "First User Role",
      status: "interview",
    });

    await secondAgent.post("/api/applications").send({
      company: "Second User Company",
      position: "Second User Role",
      status: "rejected",
    });

    const firstResponse = await agent.get("/api/applications/stats");
    const secondResponse = await secondAgent.get("/api/applications/stats");

    expect(firstResponse.status).toBe(200);
    expect(firstResponse.body).toMatchObject({
      total: 1,
      active: 1,
      interviews: 1,
      offers: 0,
    });

    expect(secondResponse.status).toBe(200);
    expect(secondResponse.body).toMatchObject({
      total: 1,
      active: 0,
      interviews: 0,
      offers: 0,
    });
  });

  it("sorts applications by updated date", async () => {
    const olderResponse = await agent.post("/api/applications").send({
      company: "Older Company",
      position: "Older Role",
    });

    await agent.post("/api/applications").send({
      company: "Newer Company",
      position: "Newer Role",
    });

    const olderId = olderResponse.body.id as string;

    await agent.patch(`/api/applications/${olderId}`).send({
      notes: "Recently updated.",
    });

    const response = await agent.get(
      "/api/applications?sortBy=updatedAt&sortOrder=desc",
    );

    expect(response.status).toBe(200);
    expect(response.body.data[0]).toMatchObject({
      id: olderId,
      company: "Older Company",
    });
  });

  it("rejects unsupported application sort fields", async () => {
    const response = await agent.get("/api/applications?sortBy=updated");

    expect(response.status).toBe(400);
  });

  it("paginates application results", async () => {
    await agent.post("/api/applications").send({
      company: "Company One",
      position: "Developer",
    });

    await agent.post("/api/applications").send({
      company: "Company Two",
      position: "QA Tester",
    });

    await agent.post("/api/applications").send({
      company: "Company Three",
      position: "Technical Support",
    });

    const response = await agent.get("/api/applications?page=2&limit=2");

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);

    expect(response.body.pagination).toEqual({
      page: 2,
      limit: 2,
      total: 3,
      totalPages: 2,
    });
  });

  it("rejects an excessive page limit", async () => {
    const response = await agent.get("/api/applications?limit=101");

    expect(response.status).toBe(400);
  });

  it("prevents users from accessing another user's application", async () => {
    const secondAgent = request.agent(app);
    attachCsrfToUnsafeRequests(secondAgent, await getCsrfToken(secondAgent));

    await secondAgent
      .post("/api/auth/register")
      .send({
        name: "Second Tester",
        email: SECOND_USER_EMAIL,
        password: TEST_PASSWORD,
      })
      .expect(201);

    const createResponse = await secondAgent.post("/api/applications").send({
      company: "Private Company",
      position: "Private Position",
    });

    expect(createResponse.status).toBe(201);

    const applicationId = createResponse.body.id as string;

    const firstUserList = await agent.get("/api/applications");

    expect(firstUserList.status).toBe(200);
    expect(firstUserList.body.data).toEqual([]);

    await agent.get(`/api/applications/${applicationId}`).expect(404);

    await agent
      .patch(`/api/applications/${applicationId}`)
      .send({
        status: "interview",
      })
      .expect(404);

    await agent.delete(`/api/applications/${applicationId}`).expect(404);

    const ownerResponse = await secondAgent.get(
      `/api/applications/${applicationId}`,
    );

    expect(ownerResponse.status).toBe(200);

    expect(ownerResponse.body).toMatchObject({
      id: applicationId,
      company: "Private Company",
      position: "Private Position",
    });
  });
});
