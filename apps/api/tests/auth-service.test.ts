import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../src/modules/auth/auth.repository.js", () => ({
  findUserByEmail: vi.fn(),
  createUser: vi.fn(),
  createSession: vi.fn(),
  findValidSessionByTokenHash: vi.fn(),
  deleteSessionByTokenHash: vi.fn(),
}));

vi.mock("../src/modules/auth/password.js", () => ({
  hashPassword: vi.fn(),
  verifyPassword: vi.fn(),
}));

vi.mock("../src/modules/auth/session-token.js", () => ({
  createSessionToken: vi.fn(),
  hashSessionToken: vi.fn(),
}));

import {
  createSession,
  createUser,
  deleteSessionByTokenHash,
  findUserByEmail,
  findValidSessionByTokenHash,
} from "../src/modules/auth/auth.repository.js";
import {
  authenticateSession,
  loginUser,
  logoutUser,
  registerUser,
} from "../src/modules/auth/auth.service.js";
import { hashPassword, verifyPassword } from "../src/modules/auth/password.js";
import {
  createSessionToken,
  hashSessionToken,
} from "../src/modules/auth/session-token.js";

const user = {
  id: "d760ddde-4145-4822-b6b4-c96d72c60c6a",
  email: "josef@example.com",
  name: "Josef Soriente",
  passwordHash: "stored-password-hash",
  createdAt: new Date("2026-08-30T00:00:00.000Z"),
  updatedAt: new Date("2026-08-30T00:00:00.000Z"),
};

describe("authentication service", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(createSessionToken).mockReturnValue("raw-session-token");

    vi.mocked(hashSessionToken).mockReturnValue("hashed-session-token");

    vi.mocked(hashPassword).mockResolvedValue("stored-password-hash");

    vi.mocked(verifyPassword).mockResolvedValue(true);

    vi.mocked(createSession).mockResolvedValue({
      id: "71646170-ccf1-4c6f-9aa1-b2b7077eeb88",
      userId: user.id,
      tokenHash: "hashed-session-token",
      expiresAt: new Date("2026-09-06T00:00:00.000Z"),
      createdAt: new Date("2026-08-30T00:00:00.000Z"),
    });
  });

  it("registers a user and starts a session", async () => {
    vi.mocked(findUserByEmail).mockResolvedValue(null);

    vi.mocked(createUser).mockResolvedValue(user);

    const result = await registerUser({
      name: "Josef Soriente",
      email: "josef@example.com",
      password: "StrongPassword123!",
    });

    expect(hashPassword).toHaveBeenCalledWith("StrongPassword123!");

    expect(createUser).toHaveBeenCalledWith({
      email: "josef@example.com",
      name: "Josef Soriente",
      passwordHash: "stored-password-hash",
    });

    expect(createSession).toHaveBeenCalledWith({
      userId: user.id,
      tokenHash: "hashed-session-token",
      expiresAt: expect.any(Date),
    });

    expect(result.user).toEqual({
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt.toISOString(),
    });

    expect(result.sessionToken).toBe("raw-session-token");
  });

  it("rejects an already registered email", async () => {
    vi.mocked(findUserByEmail).mockResolvedValue(user);

    await expect(
      registerUser({
        name: "Josef Soriente",
        email: "josef@example.com",
        password: "StrongPassword123!",
      }),
    ).rejects.toMatchObject({
      code: "EMAIL_ALREADY_REGISTERED",
      statusCode: 409,
    });

    expect(hashPassword).not.toHaveBeenCalled();
    expect(createUser).not.toHaveBeenCalled();
  });

  it("logs in with valid credentials", async () => {
    vi.mocked(findUserByEmail).mockResolvedValue(user);

    const result = await loginUser({
      email: "josef@example.com",
      password: "StrongPassword123!",
    });

    expect(verifyPassword).toHaveBeenCalledWith(
      "StrongPassword123!",
      user.passwordHash,
    );

    expect(createSession).toHaveBeenCalled();
    expect(result.sessionToken).toBe("raw-session-token");
  });

  it("rejects an unknown login email", async () => {
    vi.mocked(findUserByEmail).mockResolvedValue(null);

    await expect(
      loginUser({
        email: "missing@example.com",
        password: "StrongPassword123!",
      }),
    ).rejects.toMatchObject({
      code: "INVALID_CREDENTIALS",
      statusCode: 401,
    });

    expect(verifyPassword).not.toHaveBeenCalled();
  });

  it("rejects an incorrect password", async () => {
    vi.mocked(findUserByEmail).mockResolvedValue(user);

    vi.mocked(verifyPassword).mockResolvedValue(false);

    await expect(
      loginUser({
        email: "josef@example.com",
        password: "WrongPassword123!",
      }),
    ).rejects.toMatchObject({
      code: "INVALID_CREDENTIALS",
      statusCode: 401,
    });

    expect(createSession).not.toHaveBeenCalled();
  });

  it("authenticates a valid session", async () => {
    vi.mocked(findValidSessionByTokenHash).mockResolvedValue({
      id: "71646170-ccf1-4c6f-9aa1-b2b7077eeb88",
      userId: user.id,
      tokenHash: "hashed-session-token",
      expiresAt: new Date("2026-09-06T00:00:00.000Z"),
      createdAt: new Date("2026-08-30T00:00:00.000Z"),
      user,
    });

    const result = await authenticateSession("raw-session-token");

    expect(hashSessionToken).toHaveBeenCalledWith("raw-session-token");

    expect(result?.email).toBe("josef@example.com");
  });

  it("deletes the session during logout", async () => {
    vi.mocked(deleteSessionByTokenHash).mockResolvedValue({
      count: 1,
    });

    await logoutUser("raw-session-token");

    expect(deleteSessionByTokenHash).toHaveBeenCalledWith(
      "hashed-session-token",
    );
  });
});
