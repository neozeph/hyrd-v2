export interface AuthenticatedUser {
  id: string;
  email: string;
  createdAt: string;
}

export interface AuthenticationResult {
  user: AuthenticatedUser;
  sessionToken: string;
  sessionExpiresAt: Date;
}
