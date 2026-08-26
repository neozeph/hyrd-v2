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
});
