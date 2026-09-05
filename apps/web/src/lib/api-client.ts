import { ApiError } from "./api-error";

type RequestOptions = {
  body?: unknown;
  method?: "DELETE" | "GET" | "PATCH" | "POST";
  signal?: AbortSignal;
};

type ErrorBody = {
  code?: string;
  details?: unknown;
  error?: string;
};

const unsafeMethods = new Set(["DELETE", "PATCH", "POST", "PUT"]);
let csrfToken: string | null = null;
let csrfTokenPromise: Promise<string> | null = null;

async function parseJsonSafely(response: Response) {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

function getApiBaseUrl() {
  const apiBaseUrl = import.meta.env.VITE_API_URL;

  if (!apiBaseUrl) {
    throw new ApiError({
      message: "VITE_API_URL is not configured.",
      status: 0,
    });
  }

  return apiBaseUrl;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

async function fetchCsrfToken(apiBaseUrl: string): Promise<string> {
  const response = await fetch(`${apiBaseUrl}/api/auth/csrf`, {
    credentials: "include",
    method: "GET",
  });
  const parsedBody = await parseJsonSafely(response);

  if (!response.ok) {
    if (response.status === 401) clearCsrfToken();

    throw new ApiError({
      message: "Unable to prepare a secure request.",
      status: response.status,
    });
  }

  if (!isRecord(parsedBody) || typeof parsedBody.csrfToken !== "string") {
    throw new ApiError({
      message: "Invalid CSRF response.",
      status: response.status,
    });
  }

  csrfToken = parsedBody.csrfToken;
  return csrfToken;
}

async function getCsrfToken(apiBaseUrl: string): Promise<string> {
  if (csrfToken !== null) return csrfToken;

  csrfTokenPromise ??= fetchCsrfToken(apiBaseUrl).finally(() => {
    csrfTokenPromise = null;
  });

  return csrfTokenPromise;
}

export function clearCsrfToken(): void {
  csrfToken = null;
  csrfTokenPromise = null;
}

export async function apiRequest<T>(
  path: string,
  { body, method = "GET", signal }: RequestOptions = {},
): Promise<T> {
  const apiBaseUrl = getApiBaseUrl();
  const headers: Record<string, string> = {};

  if (unsafeMethods.has(method)) {
    headers["X-CSRF-Token"] = await getCsrfToken(apiBaseUrl);
  }

  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(`${apiBaseUrl}${path}`, {
    body: body === undefined ? undefined : JSON.stringify(body),
    credentials: "include",
    headers,
    method,
    signal,
  });

  const parsedBody = await parseJsonSafely(response);

  if (!response.ok) {
    const errorBody =
      parsedBody !== null && typeof parsedBody === "object"
        ? (parsedBody as ErrorBody)
        : {};

    if (response.status === 401) clearCsrfToken();

    throw new ApiError({
      code: errorBody.code,
      details: errorBody.details,
      message: errorBody.error ?? `Request failed with status ${response.status}`,
      status: response.status,
    });
  }

  if (
    path === "/api/auth/login" ||
    path === "/api/auth/logout" ||
    path === "/api/auth/register"
  ) {
    clearCsrfToken();
  }

  return parsedBody as T;
}
