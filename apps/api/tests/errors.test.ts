import request from "supertest";
import { describe, expect, it } from "vitest";

import { app } from "../src/app.js";

describe("API error handling", () => {
  it("returns 404 for an unknown route", async () => {
    const response = await request(app).get("/api/route-that-does-not-exist");

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      error: "Route not found",
    });
  });

  it("returns 400 for malformed JSON", async () => {
    const response = await request(app)
      .post("/api/applications")
      .set("Content-Type", "application/json")
      .send('{"company":');

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: "Invalid JSON",
    });
  });

  it("rejects an oversized JSON request", async () => {
    const response = await request(app)
      .post("/api/applications")
      .send({
        company: "IBM",
        position: "Developer",
        notes: "a".repeat(110 * 1024),
      });

    expect(response.status).toBe(413);
    expect(response.body).toEqual({
      error: "Request body is too large",
    });
  });
});
