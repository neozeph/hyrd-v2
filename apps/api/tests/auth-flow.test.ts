import request from "supertest";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { app } from "../src/app.js";
import { prisma } from "../src/lib/prisma.js";

const TEST_EMAIL = "auth-test@hyrd.dev";
const TEST_PASSWORD = "StrongPassword123!";

async function getCsrfToken(agent: ReturnType<typeof request.agent>) {
  const response = await agent.get("/api/auth/csrf").expect(200);
  return response.body.csrfToken as string;
}

async function removeTestUser() {
  await prisma.user.deleteMany({
    where: {
      email: TEST_EMAIL,
    },
  });
}

describe("authentication API", () => {
  beforeEach(async () => {
    await removeTestUser();
  });

  afterEach(async () => {
    await removeTestUser();
  });

  it("registers and authenticates a user", async () => {
    const agent = request.agent(app);
    const csrfToken = await getCsrfToken(agent);

    const registrationResponse = await agent
      .post("/api/auth/register")
      .set("X-CSRF-Token", csrfToken)
      .send({
        name: "Josef Soriente",
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      });

    expect(registrationResponse.status).toBe(201);

    expect(registrationResponse.body.user).toMatchObject({
      email: TEST_EMAIL,
      name: "Josef Soriente",
    });

    expect(registrationResponse.body.user).not.toHaveProperty("passwordHash");
    expect(registrationResponse.body.user).not.toHaveProperty("sessionToken");

    expect(registrationResponse.body).not.toHaveProperty("sessionToken");

    const setCookieHeader = registrationResponse.headers["set-cookie"];

    expect(setCookieHeader?.[0]).toContain("hyrd_session=");

    expect(setCookieHeader?.[0]).toContain("HttpOnly");

    const currentUserResponse = await agent.get("/api/auth/me");

    expect(currentUserResponse.status).toBe(200);

    expect(currentUserResponse.body.user).toMatchObject({
      email: TEST_EMAIL,
      name: "Josef Soriente",
    });
  });

  it("rejects duplicate registration", async () => {
    const firstAgent = request.agent(app);
    const secondAgent = request.agent(app);
    const firstCsrfToken = await getCsrfToken(firstAgent);
    const secondCsrfToken = await getCsrfToken(secondAgent);

    const firstResponse = await firstAgent
      .post("/api/auth/register")
      .set("X-CSRF-Token", firstCsrfToken)
      .send({
        name: "Josef Soriente",
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      });

    expect(firstResponse.status).toBe(201);

    const duplicateResponse = await secondAgent
      .post("/api/auth/register")
      .set("X-CSRF-Token", secondCsrfToken)
      .send({
        name: "Josef Soriente",
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      });

    expect(duplicateResponse.status).toBe(409);

    expect(duplicateResponse.body).toMatchObject({
      code: "EMAIL_ALREADY_REGISTERED",
    });
  });

  it("rejects invalid login credentials", async () => {
    const agent = request.agent(app);
    const csrfToken = await getCsrfToken(agent);
    const response = await agent
      .post("/api/auth/login")
      .set("X-CSRF-Token", csrfToken)
      .send({
        email: TEST_EMAIL,
        password: "IncorrectPassword123!",
      });

    expect(response.status).toBe(401);

    expect(response.body).toMatchObject({
      code: "INVALID_CREDENTIALS",
      error: "Invalid email or password",
    });
  });

  it("logs in, logs out, and invalidates the session", async () => {
    const registrationAgent = request.agent(app);
    const registrationCsrfToken = await getCsrfToken(registrationAgent);

    await registrationAgent
      .post("/api/auth/register")
      .set("X-CSRF-Token", registrationCsrfToken)
      .send({
        name: "Josef Soriente",
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      })
      .expect(201);

    const authenticatedRegistrationCsrfToken = await getCsrfToken(registrationAgent);

    await registrationAgent
      .post("/api/auth/logout")
      .set("X-CSRF-Token", authenticatedRegistrationCsrfToken)
      .expect(204);

    const agent = request.agent(app);
    const csrfToken = await getCsrfToken(agent);

    const loginResponse = await agent
      .post("/api/auth/login")
      .set("X-CSRF-Token", csrfToken)
      .send({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      });

    expect(loginResponse.status).toBe(200);

    await agent.get("/api/auth/me").expect(200);
    const authenticatedCsrfToken = await getCsrfToken(agent);

    const logoutResponse = await agent
      .post("/api/auth/logout")
      .set("X-CSRF-Token", authenticatedCsrfToken);

    expect(logoutResponse.status).toBe(204);

    expect(logoutResponse.headers["set-cookie"]?.[0]).toContain(
      "hyrd_session=;",
    );

    await agent.get("/api/auth/me").expect(401);
  });
});
