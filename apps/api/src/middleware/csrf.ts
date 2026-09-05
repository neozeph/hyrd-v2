import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import type { CookieOptions, Request, RequestHandler, Response } from "express";

import { cookieSameSite, csrfSecret, env } from "../config/env.js";
import { SESSION_COOKIE_NAME } from "../modules/auth/auth.cookie.js";
import { authenticateSession } from "../modules/auth/auth.service.js";

export const CSRF_COOKIE_NAME = "hyrd_csrf";
export const CSRF_HEADER_NAME = "x-csrf-token";
export const CSRF_ERROR_CODE = "INVALID_CSRF_TOKEN";

const unsafeMethods = new Set(["DELETE", "PATCH", "POST", "PUT"]);
const guestUnsafePaths = new Set(["/api/auth/login", "/api/auth/register"]);

const csrfCookieOptions: CookieOptions = {
  httpOnly: true,
  path: "/",
  sameSite: cookieSameSite,
  secure: env.NODE_ENV === "production",
};

type CsrfTokenPayload =
  | {
      binding?: undefined;
      kind: "guest";
      nonce: string;
      version: 1;
    }
  | {
      binding: string;
      kind: "session";
      nonce: string;
      version: 1;
    };

function signValue(value: string, purpose = "csrf-token"): string {
  return createHmac("sha256", csrfSecret)
    .update(`${purpose}:${value}`)
    .digest("base64url");
}

function createSessionBinding(sessionToken: string): string {
  return signValue(sessionToken, "csrf-session-binding");
}

function encodePayload(payload: CsrfTokenPayload): string {
  return Buffer.from(JSON.stringify(payload)).toString("base64url");
}

function signPayload(encodedPayload: string): string {
  return signValue(encodedPayload);
}

function createCsrfToken(binding?: string): string {
  const nonce = randomBytes(32).toString("base64url");
  const payload: CsrfTokenPayload =
    binding === undefined
      ? {
          kind: "guest",
          nonce,
          version: 1,
        }
      : {
          binding,
          kind: "session",
          nonce,
          version: 1,
        };
  const encodedPayload = encodePayload(payload);
  return `${encodedPayload}.${signPayload(encodedPayload)}`;
}

function safeEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  return (
    leftBuffer.length === rightBuffer.length &&
    timingSafeEqual(leftBuffer, rightBuffer)
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function parseCsrfToken(token: string): CsrfTokenPayload | null {
  const [encodedPayload, signature, extra] = token.split(".");

  if (!encodedPayload || !signature || extra !== undefined) return null;
  if (!safeEqual(signature, signPayload(encodedPayload))) return null;

  try {
    const payload = JSON.parse(
      Buffer.from(encodedPayload, "base64url").toString("utf8"),
    ) as unknown;

    if (!isRecord(payload) || payload.version !== 1) return null;
    if (typeof payload.nonce !== "string" || payload.nonce.length === 0) {
      return null;
    }

    if (payload.kind === "guest") {
      return {
        kind: "guest",
        nonce: payload.nonce,
        version: 1,
      };
    }

    if (payload.kind === "session" && typeof payload.binding === "string") {
      return {
        binding: payload.binding,
        kind: "session",
        nonce: payload.nonce,
        version: 1,
      };
    }
  } catch {
    return null;
  }

  return null;
}

function getSessionToken(request: Request): string | null {
  const sessionToken: unknown = request.cookies[SESSION_COOKIE_NAME];

  return typeof sessionToken === "string" && sessionToken.length > 0
    ? sessionToken
    : null;
}

function rejectCsrf(response: Response): void {
  response.status(403).json({
    error: "Invalid CSRF token",
    code: CSRF_ERROR_CODE,
  });
}

export const issueCsrfToken: RequestHandler = async (request, response, next) => {
  const sessionToken = getSessionToken(request);

  try {
    const user =
      sessionToken === null ? null : await authenticateSession(sessionToken);
    const csrfToken = createCsrfToken(
      user === null || sessionToken === null
        ? undefined
        : createSessionBinding(sessionToken),
    );

    response.cookie(CSRF_COOKIE_NAME, csrfToken, csrfCookieOptions);
    response.status(200).json({ csrfToken });
  } catch (error) {
    next(error);
  }
};

export const clearCsrfCookie: RequestHandler = (_request, response, next) => {
  response.clearCookie(CSRF_COOKIE_NAME, csrfCookieOptions);
  next();
};

export function clearCsrf(response: {
  clearCookie: (name: string, options: CookieOptions) => unknown;
}): void {
  response.clearCookie(CSRF_COOKIE_NAME, csrfCookieOptions);
}

export const requireCsrfToken: RequestHandler = (request, response, next) => {
  if (!unsafeMethods.has(request.method)) {
    next();
    return;
  }

  const cookieToken: unknown = request.cookies[CSRF_COOKIE_NAME];
  const headerToken = request.get(CSRF_HEADER_NAME);
  const sessionToken = getSessionToken(request);

  if (
    typeof cookieToken !== "string" ||
    typeof headerToken !== "string" ||
    !safeEqual(cookieToken, headerToken)
  ) {
    rejectCsrf(response);
    return;
  }

  const payload = parseCsrfToken(headerToken);

  if (payload === null) {
    rejectCsrf(response);
    return;
  }

  if (payload.kind === "guest") {
    if (sessionToken === null && guestUnsafePaths.has(request.path)) {
      next();
      return;
    }

    rejectCsrf(response);
    return;
  }

  if (
    sessionToken === null ||
    !safeEqual(payload.binding, createSessionBinding(sessionToken))
  ) {
    rejectCsrf(response);
    return;
  }

  next();
};
