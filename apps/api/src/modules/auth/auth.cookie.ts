import type { CookieOptions } from "express";

import { cookieSameSite, env } from "../../config/env.js";

export const SESSION_COOKIE_NAME = "hyrd_session";

const baseSessionCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: cookieSameSite,
  path: "/",
};

export function getSessionCookieOptions(expiresAt: Date): CookieOptions {
  return {
    ...baseSessionCookieOptions,
    expires: expiresAt,
  };
}

export function getClearSessionCookieOptions(): CookieOptions {
  return baseSessionCookieOptions;
}
