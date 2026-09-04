import request from "supertest";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { app } from "../src/app.js";
import { prisma } from "../src/lib/prisma.js";
import { resetRateLimiters } from "../src/middleware/rate-limit.js";

const TEST_EMAIL = "security-test@hyrd.dev";
const TEST_PASSWORD = "StrongPassword123!";

async function removeTestUser() {
  await prisma.user.deleteMany({
    where: {
      email: TEST_EMAIL,
    },
  });
}

async function getCsrfToken(agent: ReturnType<typeof request.agent>) {
  const response = await agent.get("/api/auth/csrf").expect(200);
  return response.body.csrfToken as string;
}

describe("API request security", () => {
  beforeEach(async () => {
    resetRateLimiters();
    await removeTestUser();
  });

  afterEach(async () => {
    resetRateLimiters();
    await removeTestUser();
  });

  it("bootstraps a CSRF token before authentication", async () => {
    const agent = request.agent(app);

    const response = await agent.get("/api/auth/csrf");

    expect(response.status).toBe(200);
    expect(response.body.csrfToken).toEqual(expect.any(String));
    expect(response.headers["set-cookie"]?.[0]).toContain("hyrd_csrf=");
  });

  it("allows registration and login with a valid CSRF token", async () => {
    const registrationAgent = request.agent(app);
    const registrationCsrfToken = await getCsrfToken(registrationAgent);

    await registrationAgent
      .post("/api/auth/register")
      .set("X-CSRF-Token", registrationCsrfToken)
      .send({
        name: "Security Tester",
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      })
      .expect(201);

    const loginAgent = request.agent(app);
    const loginCsrfToken = await getCsrfToken(loginAgent);

    await loginAgent
      .post("/api/auth/login")
      .set("X-CSRF-Token", loginCsrfToken)
      .send({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      })
      .expect(200);
  });

  it("rejects unsafe requests with a missing CSRF token", async () => {
    const response = await request(app).post("/api/auth/login").send({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    });

    expect(response.status).toBe(403);
    expect(response.body).toEqual({
      error: "Invalid CSRF token",
      code: "INVALID_CSRF_TOKEN",
    });
  });

  it("rejects unsafe requests with a mismatched CSRF token", async () => {
    const agent = request.agent(app);
    await getCsrfToken(agent);

    const response = await agent
      .post("/api/auth/login")
      .set("X-CSRF-Token", "mismatched-token")
      .send({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      });

    expect(response.status).toBe(403);
    expect(response.body.code).toBe("INVALID_CSRF_TOKEN");
  });

  it("rejects explicitly disallowed origins for unsafe requests", async () => {
    const agent = request.agent(app);
    const csrfToken = await getCsrfToken(agent);

    const response = await agent
      .post("/api/auth/login")
      .set("Origin", "https://attacker.example")
      .set("X-CSRF-Token", csrfToken)
      .send({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      });

    expect(response.status).toBe(403);
    expect(response.body).toEqual({
      error: "Request origin is not allowed",
      code: "ORIGIN_NOT_ALLOWED",
    });
  });

  it("leaves safe GET requests unaffected", async () => {
    const response = await request(app).get("/api/health");

    expect(response.status).toBe(200);
    expect(response.body.status).toBe("ok");
  });

  it("allows authenticated application mutations with a valid CSRF token", async () => {
    const agent = request.agent(app);
    const csrfToken = await getCsrfToken(agent);

    await agent
      .post("/api/auth/register")
      .set("X-CSRF-Token", csrfToken)
      .send({
        name: "Security Tester",
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      })
      .expect(201);

    const response = await agent
      .post("/api/applications")
      .set("X-CSRF-Token", csrfToken)
      .send({
        company: "Secure Company",
        position: "Secure Role",
      });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      company: "Secure Company",
      position: "Secure Role",
    });
  });

  it("rate limits excessive authentication attempts", async () => {
    const agent = request.agent(app);
    const csrfToken = await getCsrfToken(agent);

    for (let attempt = 0; attempt < 20; attempt += 1) {
      await agent
        .post("/api/auth/login")
        .set("X-CSRF-Token", csrfToken)
        .send({
          email: TEST_EMAIL,
          password: "WrongPassword123!",
        });
    }

    const response = await agent
      .post("/api/auth/login")
      .set("X-CSRF-Token", csrfToken)
      .send({
        email: TEST_EMAIL,
        password: "WrongPassword123!",
      });

    expect(response.status).toBe(429);
    expect(response.headers["ratelimit-limit"]).toBe("20");
    expect(response.body).toEqual({
      error: "Too many requests",
      code: "RATE_LIMITED",
    });
  });
});
