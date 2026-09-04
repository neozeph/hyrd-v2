import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { ApiError } from "../lib/api-error";
import { applicationQueryKeys } from "../lib/application-queries";
import {
  getCurrentUserRequest,
  loginRequest,
  logoutRequest,
  registerRequest,
} from "../lib/auth-api";
import { queryClient } from "../lib/query-client";
import type {
  AuthenticatedUser,
  LoginRequest,
  RegisterRequest,
} from "../types/auth";
import { AuthContext } from "./auth-context-value";
import type { AuthContextValue } from "./auth-context-value";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const restoreSession = useCallback(async () => {
    setIsLoading(true);

    try {
      const response = await getCurrentUserRequest();
      setUser(response.user);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        setUser(null);
        queryClient.removeQueries({ queryKey: applicationQueryKeys.all });
        return;
      }

      setUser(null);
      queryClient.removeQueries({ queryKey: applicationQueryKeys.all });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isActive = true;

    async function initializeSession() {
      try {
        const response = await getCurrentUserRequest();
        if (isActive) setUser(response.user);
      } catch {
        if (isActive) {
          setUser(null);
          queryClient.removeQueries({ queryKey: applicationQueryKeys.all });
        }
      } finally {
        if (isActive) setIsLoading(false);
      }
    }

    void initializeSession();

    return () => {
      isActive = false;
    };
  }, []);

  const login = useCallback(async (input: LoginRequest) => {
    const response = await loginRequest(input);
    setUser(response.user);
  }, []);

  const register = useCallback(async (input: RegisterRequest) => {
    const response = await registerRequest(input);
    setUser(response.user);
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutRequest();
    } catch (error) {
      if (!(error instanceof ApiError) || error.status !== 401) {
        throw error;
      }
    } finally {
      setUser(null);
      queryClient.removeQueries({ queryKey: applicationQueryKeys.all });
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      isAuthenticated: user !== null,
      isLoading,
      login,
      logout,
      register,
      restoreSession,
      user,
    }),
    [isLoading, login, logout, register, restoreSession, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
