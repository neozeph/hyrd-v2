export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string | null;
  createdAt: string;
}

export interface AuthenticationResult {
  user: AuthenticatedUser;
  sessionToken: string;
  sessionExpiresAt: Date;
}
