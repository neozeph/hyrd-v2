import { createContext } from "react";

import type {
  AuthenticatedUser,
  LoginRequest,
  RegisterRequest,
} from "../types/auth";

export type AuthContextValue = {
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (input: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  register: (input: RegisterRequest) => Promise<void>;
  restoreSession: () => Promise<void>;
  user: AuthenticatedUser | null;
};

export const AuthContext = createContext<AuthContextValue | null>(null);
