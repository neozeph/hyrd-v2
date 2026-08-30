import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "../src/lib/prisma.js";
import { app } from "../src/app.js";
import { resetApplications } from "../src/modules/applications/application.repository.js";

const nonexistentApplicationId = "00000000-0000-4000-8000-000000000000";

const TEST_EMAIL = "applications-test@hyrd.dev";

const SECOND_USER_EMAIL = "applications-isolation-test@hyrd.dev";

const TEST_PASSWORD = "StrongPassword123!";

let agent: ReturnType<typeof request.agent>;

async function removeTestUsers() {
  await prisma.user.deleteMany({
    where: {
      email: {
        in: [TEST_EMAIL, SECOND_USER_EMAIL],
      },
    },
  });
}

describe("Applications API", () => {
  beforeAll(async () => {
    await resetApplications();
    await removeTestUsers();

    agent = request.agent(app);

    await agent
      .post("/api/auth/register")
      .send({
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

    await secondAgent
      .post("/api/auth/register")
      .send({
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
