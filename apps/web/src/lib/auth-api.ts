import { apiRequest } from "./api-client";
import type { AuthResponse, LoginRequest, RegisterRequest } from "../types/auth";

export function loginRequest(input: LoginRequest) {
  return apiRequest<AuthResponse>("/api/auth/login", {
    body: input,
    method: "POST",
  });
}

export function registerRequest(input: RegisterRequest) {
  return apiRequest<AuthResponse>("/api/auth/register", {
    body: input,
    method: "POST",
  });
}

export function getCurrentUserRequest() {
  return apiRequest<AuthResponse>("/api/auth/me");
}

export function logoutRequest() {
  return apiRequest<null>("/api/auth/logout", {
    method: "POST",
  });
}
