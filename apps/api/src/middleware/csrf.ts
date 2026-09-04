import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import type { CookieOptions, RequestHandler } from "express";

import { cookieSameSite, csrfSecret, env } from "../config/env.js";

export const CSRF_COOKIE_NAME = "hyrd_csrf";
export const CSRF_HEADER_NAME = "x-csrf-token";
export const CSRF_ERROR_CODE = "INVALID_CSRF_TOKEN";

const unsafeMethods = new Set(["DELETE", "PATCH", "POST", "PUT"]);

const csrfCookieOptions: CookieOptions = {
  httpOnly: true,
  path: "/",
  sameSite: cookieSameSite,
  secure: env.NODE_ENV === "production",
};

function signToken(nonce: string): string {
  return createHmac("sha256", csrfSecret).update(nonce).digest("base64url");
}

function createCsrfToken(): string {
  const nonce = randomBytes(32).toString("base64url");
  return `${nonce}.${signToken(nonce)}`;
}

function safeEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  return (
    leftBuffer.length === rightBuffer.length &&
    timingSafeEqual(leftBuffer, rightBuffer)
  );
}

function isValidSignedToken(token: string): boolean {
  const [nonce, signature, extra] = token.split(".");

  if (!nonce || !signature || extra !== undefined) return false;

  return safeEqual(signature, signToken(nonce));
}

export const issueCsrfToken: RequestHandler = (_request, response) => {
  const csrfToken = createCsrfToken();

  response.cookie(CSRF_COOKIE_NAME, csrfToken, csrfCookieOptions);
  response.status(200).json({ csrfToken });
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

  if (
    typeof cookieToken !== "string" ||
    typeof headerToken !== "string" ||
    !safeEqual(cookieToken, headerToken) ||
    !isValidSignedToken(headerToken)
  ) {
    response.status(403).json({
      error: "Invalid CSRF token",
      code: CSRF_ERROR_CODE,
    });
    return;
  }

  next();
};
