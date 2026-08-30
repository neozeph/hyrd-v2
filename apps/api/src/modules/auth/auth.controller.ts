import type { NextFunction, Request, RequestHandler, Response } from "express";

import {
  getClearSessionCookieOptions,
  getSessionCookieOptions,
  SESSION_COOKIE_NAME,
} from "./auth.cookie.js";
import { AuthServiceError } from "./auth.errors.js";
import { loginSchema, registerSchema } from "./auth.schema.js";
import {
  authenticateSession,
  loginUser,
  logoutUser,
  registerUser,
} from "./auth.service.js";

function getSessionToken(request: Request): string | null {
  const token: unknown = request.cookies[SESSION_COOKIE_NAME];

  if (typeof token !== "string" || token.length === 0) {
    return null;
  }

  return token;
}

function handleAuthError(
  error: unknown,
  response: Response,
  next: NextFunction,
): void {
  if (error instanceof AuthServiceError) {
    response.status(error.statusCode).json({
      error: error.message,
      code: error.code,
    });

    return;
  }

  next(error);
}

export const register: RequestHandler = async (request, response, next) => {
  const result = registerSchema.safeParse(request.body);

  if (!result.success) {
    response.status(400).json({
      error: "Invalid registration data",
      details: result.error.flatten(),
    });

    return;
  }

  try {
    const authentication = await registerUser(result.data);

    response.cookie(
      SESSION_COOKIE_NAME,
      authentication.sessionToken,
      getSessionCookieOptions(authentication.sessionExpiresAt),
    );

    response.status(201).json({
      user: authentication.user,
    });
  } catch (error) {
    handleAuthError(error, response, next);
  }
};

export const login: RequestHandler = async (request, response, next) => {
  const result = loginSchema.safeParse(request.body);

  if (!result.success) {
    response.status(400).json({
      error: "Invalid login data",
      details: result.error.flatten(),
    });

    return;
  }

  try {
    const authentication = await loginUser(result.data);

    response.cookie(
      SESSION_COOKIE_NAME,
      authentication.sessionToken,
      getSessionCookieOptions(authentication.sessionExpiresAt),
    );

    response.status(200).json({
      user: authentication.user,
    });
  } catch (error) {
    handleAuthError(error, response, next);
  }
};

export const logout: RequestHandler = async (request, response, next) => {
  const sessionToken = getSessionToken(request);

  try {
    if (sessionToken !== null) {
      await logoutUser(sessionToken);
    }

    response.clearCookie(SESSION_COOKIE_NAME, getClearSessionCookieOptions());

    response.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const getCurrentUser: RequestHandler = (request, response) => {
  response.status(200).json({
    user: request.authUser,
  });
};
