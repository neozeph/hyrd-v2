export type AuthErrorCode =
  | "EMAIL_ALREADY_REGISTERED"
  | "INVALID_CREDENTIALS"
  | "INVALID_SESSION";

export class AuthServiceError extends Error {
  constructor(
    public readonly code: AuthErrorCode,
    public readonly statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = "AuthServiceError";
  }
}
