import {
  createSession,
  deleteSessionByTokenHash,
  findUserByEmail,
  findValidSessionByTokenHash,
  createUser,
} from "./auth.repository.js";
import { AuthServiceError } from "./auth.errors.js";
import { toAuthenticatedUser } from "./auth.mapper.js";
import { hashPassword, verifyPassword } from "./password.js";
import { createSessionToken, hashSessionToken } from "./session-token.js";
import type { LoginInput, RegisterInput } from "./auth.schema.js";
import type { AuthenticatedUser, AuthenticationResult } from "./auth.types.js";

const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

interface SessionUser {
  id: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
}

async function startSession(user: SessionUser): Promise<AuthenticationResult> {
  const sessionToken = createSessionToken();
  const tokenHash = hashSessionToken(sessionToken);

  const sessionExpiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  await createSession({
    userId: user.id,
    tokenHash,
    expiresAt: sessionExpiresAt,
  });

  return {
    user: toAuthenticatedUser(user),
    sessionToken,
    sessionExpiresAt,
  };
}

export async function registerUser(
  input: RegisterInput,
): Promise<AuthenticationResult> {
  const existingUser = await findUserByEmail(input.email);

  if (existingUser !== null) {
    throw new AuthServiceError(
      "EMAIL_ALREADY_REGISTERED",
      409,
      "An account with this email already exists",
    );
  }

  const passwordHash = await hashPassword(input.password);

  const user = await createUser({
    email: input.email,
    passwordHash,
  });

  return startSession(user);
}

export async function loginUser(
  input: LoginInput,
): Promise<AuthenticationResult> {
  const user = await findUserByEmail(input.email);

  if (user === null) {
    throw new AuthServiceError(
      "INVALID_CREDENTIALS",
      401,
      "Invalid email or password",
    );
  }

  const passwordIsValid = await verifyPassword(
    input.password,
    user.passwordHash,
  );

  if (!passwordIsValid) {
    throw new AuthServiceError(
      "INVALID_CREDENTIALS",
      401,
      "Invalid email or password",
    );
  }

  return startSession(user);
}

export async function authenticateSession(
  sessionToken: string,
): Promise<AuthenticatedUser | null> {
  const tokenHash = hashSessionToken(sessionToken);

  const session = await findValidSessionByTokenHash(tokenHash);

  if (session === null) {
    return null;
  }

  return toAuthenticatedUser(session.user);
}

export async function logoutUser(sessionToken: string): Promise<void> {
  const tokenHash = hashSessionToken(sessionToken);

  await deleteSessionByTokenHash(tokenHash);
}
