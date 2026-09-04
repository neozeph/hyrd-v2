import type { RequestHandler } from "express";

import { env } from "../config/env.js";

const unsafeMethods = new Set(["DELETE", "PATCH", "POST", "PUT"]);

export const validateUnsafeRequestOrigin: RequestHandler = (
  request,
  response,
  next,
) => {
  if (!unsafeMethods.has(request.method)) {
    next();
    return;
  }

  const origin = request.get("origin");

  if (origin !== undefined && origin !== env.CLIENT_ORIGIN) {
    response.status(403).json({
      error: "Request origin is not allowed",
      code: "ORIGIN_NOT_ALLOWED",
    });
    return;
  }

  next();
};
