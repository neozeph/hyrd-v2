import type { RequestHandler } from "express";

import {
  getClearSessionCookieOptions,
  SESSION_COOKIE_NAME,
} from "./auth.cookie.js";
import { authenticateSession } from "./auth.service.js";

export const requireAuthentication: RequestHandler = async (
  request,
  response,
  next,
) => {
  const sessionToken: unknown = request.cookies[SESSION_COOKIE_NAME];

  if (typeof sessionToken !== "string" || sessionToken.length === 0) {
    response.status(401).json({
      error: "Authentication required",
    });

    return;
  }

  try {
    const user = await authenticateSession(sessionToken);

    if (user === null) {
      response.clearCookie(SESSION_COOKIE_NAME, getClearSessionCookieOptions());

      response.status(401).json({
        error: "Invalid or expired session",
      });

      return;
    }

    request.authUser = user;
    next();
  } catch (error) {
    next(error);
  }
};
