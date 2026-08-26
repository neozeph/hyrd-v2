import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import { logger } from "../config/logger.js";

interface RequestSyntaxError extends SyntaxError {
  status?: number;
  body?: unknown;
}

interface HttpRequestError extends Error {
  status?: number;
  type?: string;
}

export const errorHandler: ErrorRequestHandler = (
  error,
  _request,
  response,
  _next,
) => {
  if (error instanceof ZodError) {
    const firstIssue = error.issues[0];

    response.status(400).json({
      error: firstIssue?.message ?? "Invalid request",
    });
    return;
  }

  const requestError = error as RequestSyntaxError;

  if (
    requestError instanceof SyntaxError &&
    requestError.status === 400 &&
    "body" in requestError
  ) {
    response.status(400).json({
      error: "Invalid JSON",
    });
    return;
  }

  const httpError = error as HttpRequestError;

  if (httpError.status === 413) {
    response.status(413).json({
      error: "Request body is too large",
    });
    return;
  }

  logger.error(
    {
      error,
    },
    "Unhandled request error",
  );

  response.status(500).json({
    error: "Internal server error",
  });
};
