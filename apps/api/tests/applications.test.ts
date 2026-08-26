import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";

import { app } from "../src/app.js";
import { resetApplications } from "../src/modules/applications/application.repository.js";

describe("Applications API", () => {
  beforeEach(() => {
    resetApplications();
  });

  it("returns an empty application list", async () => {
    const response = await request(app).get("/api/applications");

    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
  });

  it("creates an application", async () => {
    const response = await request(app).post("/api/applications").send({
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
    const response = await request(app).post("/api/applications").send({
      company: "",
      position: "Software Developer",
    });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: "Company is required",
    });
  });

  it("rejects an invalid status", async () => {
    const response = await request(app).post("/api/applications").send({
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
    const createResponse = await request(app).post("/api/applications").send({
      company: "Accenture",
      position: "Associate Software Engineer",
    });

    const applicationId = createResponse.body.id as string;

    const response = await request(app).get(
      `/api/applications/${applicationId}`,
    );

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
    const createResponse = await request(app).post("/api/applications").send({
      company: "PathBuilder",
      position: "QA Analyst",
      status: "applied",
    });

    const applicationId = createResponse.body.id as string;
    const originalCreatedAt = createResponse.body.createdAt as string;

    const response = await request(app)
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
    const createResponse = await request(app).post("/api/applications").send({
      company: "IBM",
      position: "Technical Support Specialist",
    });

    const applicationId = createResponse.body.id as string;

    const deleteResponse = await request(app).delete(
      `/api/applications/${applicationId}`,
    );

    expect(deleteResponse.status).toBe(204);
    expect(deleteResponse.text).toBe("");

    const getResponse = await request(app).get(
      `/api/applications/${applicationId}`,
    );

    expect(getResponse.status).toBe(404);
    expect(getResponse.body).toEqual({
      error: "Application not found",
    });
  });

  it("rejects a missing position", async () => {
    const response = await request(app).post("/api/applications").send({
      company: "IBM",
    });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: "Position is required",
    });
  });

  it("returns 404 when retrieving an unknown application", async () => {
    const response = await request(app).get("/api/applications/unknown-id");

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      error: "Application not found",
    });
  });

  it("returns 404 when deleting an unknown application", async () => {
    const response = await request(app).delete("/api/applications/unknown-id");

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      error: "Application not found",
    });
  });

  it("rejects an empty company update", async () => {
    const createResponse = await request(app).post("/api/applications").send({
      company: "IBM",
      position: "Software Developer",
    });

    const applicationId = createResponse.body.id as string;

    const response = await request(app)
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
    const createResponse = await request(app).post("/api/applications").send({
      company: "IBM",
      position: "Software Developer",
    });

    const applicationId = createResponse.body.id as string;

    const response = await request(app)
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
    const response = await request(app)
      .patch("/api/applications/unknown-id")
      .send({
        status: "interview",
      });

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      error: "Application not found",
    });
  });
});
