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

async function parseJsonSafely(response: Response) {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

export async function apiRequest<T>(
  path: string,
  { body, method = "GET", signal }: RequestOptions = {},
): Promise<T> {
  const apiBaseUrl = import.meta.env.VITE_API_URL;

  if (!apiBaseUrl) {
    throw new ApiError({
      message: "VITE_API_URL is not configured.",
      status: 0,
    });
  }

  const response = await fetch(`${apiBaseUrl}${path}`, {
    body: body === undefined ? undefined : JSON.stringify(body),
    credentials: "include",
    headers: body === undefined ? undefined : { "Content-Type": "application/json" },
    method,
    signal,
  });

  const parsedBody = await parseJsonSafely(response);

  if (!response.ok) {
    const errorBody =
      parsedBody !== null && typeof parsedBody === "object"
        ? (parsedBody as ErrorBody)
        : {};

    throw new ApiError({
      code: errorBody.code,
      details: errorBody.details,
      message: errorBody.error ?? `Request failed with status ${response.status}`,
      status: response.status,
    });
  }

  return parsedBody as T;
}
