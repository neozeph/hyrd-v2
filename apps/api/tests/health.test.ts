import request from "supertest";
import { describe, expect, it } from "vitest";

import { app } from "../src/app.js";

describe("GET /api/health", () => {
  it("returns the API health status", async () => {
    const response = await request(app).get("/api/health");

    expect(response.status).toBe(200);

    expect(response.body).toEqual({
      status: "ok",
      service: "hyrd-api",
    });
  });

  it("returns security and CORS headers", async () => {
    const response = await request(app)
      .get("/api/health")
      .set("Origin", "http://localhost:5173");

    expect(response.status).toBe(200);

    expect(response.headers["x-content-type-options"]).toBe("nosniff");

    expect(response.headers["access-control-allow-origin"]).toBe(
      "http://localhost:5173",
    );

    expect(response.headers["access-control-allow-credentials"]).toBe("true");
  });

  it("serves interactive API documentation", async () => {
    const response = await request(app).get("/api/docs/");

    expect(response.status).toBe(200);

    expect(response.headers["content-type"]).toContain("text/html");

    expect(response.text).toContain("Swagger UI");
  });

  it("serves the OpenAPI document as JSON", async () => {
    const response = await request(app).get("/api/docs.json");

    expect(response.status).toBe(200);
    expect(response.body.openapi).toBe("3.0.3");

    expect(response.body.paths["/api/applications/{id}"]).toBeDefined();
  });
});
