import request from "supertest";
import { afterEach, describe, expect, it, vi } from "vitest";

import { app, createApp } from "../src/app.js";
import { parseEnv, shouldEnableApiDocs } from "../src/config/env.js";
import * as readiness from "../src/lib/readiness.js";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("GET /api/health", () => {
  it("returns the API health status without querying the database", async () => {
    const readinessSpy = vi.spyOn(readiness, "checkDatabaseReadiness");

    const response = await request(app).get("/api/health");

    expect(response.status).toBe(200);

    expect(response.body).toEqual({
      status: "ok",
      service: "hyrd-api",
    });
    expect(readinessSpy).not.toHaveBeenCalled();
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

  it("returns ready when the database check succeeds", async () => {
    vi.spyOn(readiness, "checkDatabaseReadiness").mockResolvedValue(true);

    const response = await request(app).get("/api/ready");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      status: "ready",
      service: "hyrd-api",
      database: "available",
    });
  });

  it("returns unavailable without crashing when the database check fails", async () => {
    vi.spyOn(readiness, "checkDatabaseReadiness").mockResolvedValue(false);

    const response = await request(app).get("/api/ready");

    expect(response.status).toBe(503);
    expect(response.body).toEqual({
      status: "not_ready",
      service: "hyrd-api",
      database: "unavailable",
    });
  });
});

describe("API documentation routing", () => {
  it("serves interactive API documentation when docs are enabled", async () => {
    const docsApp = createApp({ apiDocsEnabled: true });

    const response = await request(docsApp).get("/api/docs/");

    expect(response.status).toBe(200);

    expect(response.headers["content-type"]).toContain("text/html");

    expect(response.text).toContain("Swagger UI");
  });

  it("serves the OpenAPI document as JSON when docs are enabled", async () => {
    const docsApp = createApp({ apiDocsEnabled: true });

    const response = await request(docsApp).get("/api/docs.json");

    expect(response.status).toBe(200);
    expect(response.body.openapi).toBe("3.0.3");

    expect(response.body.paths["/api/applications/{id}"]).toBeDefined();
  });

  it("returns normal 404 responses when documentation is disabled", async () => {
    const docsDisabledApp = createApp({ apiDocsEnabled: false });

    const docsResponse = await request(docsDisabledApp).get("/api/docs/");
    const jsonResponse = await request(docsDisabledApp).get("/api/docs.json");

    expect(docsResponse.status).toBe(404);
    expect(docsResponse.body).toEqual({
      error: "Route not found",
    });

    expect(jsonResponse.status).toBe(404);
    expect(jsonResponse.body).toEqual({
      error: "Route not found",
    });
  });
});

describe("API documentation environment configuration", () => {
  it("defaults documentation to disabled in production when unset", () => {
    const productionEnv = parseEnv({
      DATABASE_URL: "postgresql://example.invalid/hyrd",
      NODE_ENV: "production",
      CSRF_SECRET: "production-test-secret-with-enough-length",
    });

    expect(shouldEnableApiDocs(productionEnv)).toBe(false);
  });

  it("allows explicit valid documentation overrides", () => {
    const productionEnabledEnv = parseEnv({
      DATABASE_URL: "postgresql://example.invalid/hyrd",
      NODE_ENV: "production",
      CSRF_SECRET: "production-test-secret-with-enough-length",
      ENABLE_API_DOCS: "true",
    });
    const developmentDisabledEnv = parseEnv({
      DATABASE_URL: "postgresql://example.invalid/hyrd",
      NODE_ENV: "development",
      ENABLE_API_DOCS: "false",
    });

    expect(shouldEnableApiDocs(productionEnabledEnv)).toBe(true);
    expect(shouldEnableApiDocs(developmentDisabledEnv)).toBe(false);
  });

  it("rejects invalid documentation configuration values", () => {
    expect(() =>
      parseEnv({
        DATABASE_URL: "postgresql://example.invalid/hyrd",
        NODE_ENV: "development",
        ENABLE_API_DOCS: "sometimes",
      }),
    ).toThrow();
  });
});
