import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";

interface RequestSyntaxError extends SyntaxError {
  status?: number;
  body?: unknown;
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

  console.error(error);

  response.status(500).json({
    error: "Internal server error",
  });
};
