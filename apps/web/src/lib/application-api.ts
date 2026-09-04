import type {
  ApplicationListResponse,
  ApplicationStats,
  ApplicationStatus,
  JobApplication,
} from "../types/application";
import { applicationStatuses } from "../types/application";
import { apiRequest } from "./api-client";

export type ApplicationSortBy = "createdAt" | "updatedAt" | "appliedAt" | "company";
export type SortOrder = "asc" | "desc";

export type ApplicationListParams = {
  limit?: number;
  page?: number;
  search?: string;
  sortBy?: ApplicationSortBy;
  sortOrder?: SortOrder;
  status?: ApplicationStatus | ApplicationStatus[];
};

export type ApplicationFormInput = {
  appliedAt?: string | null;
  company: string;
  jobUrl?: string | null;
  location?: string | null;
  notes?: string | null;
  position: string;
  status?: ApplicationStatus;
};

const statusSet = new Set<string>(applicationStatuses);

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function isNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isApplicationStatus(value: unknown): value is ApplicationStatus {
  return isString(value) && statusSet.has(value);
}

export function parseApplication(value: unknown): JobApplication {
  if (!isRecord(value)) throw new Error("Invalid application response.");

  const { id, company, position, status, createdAt, updatedAt } = value;

  if (
    !isString(id) ||
    !isString(company) ||
    !isString(position) ||
    !isApplicationStatus(status) ||
    !isString(createdAt) ||
    !isString(updatedAt)
  ) {
    throw new Error("Invalid application response.");
  }

  return {
    id,
    company,
    position,
    status,
    createdAt,
    updatedAt,
    ...(isString(value.location) ? { location: value.location } : {}),
    ...(isString(value.jobUrl) ? { jobUrl: value.jobUrl } : {}),
    ...(isString(value.notes) ? { notes: value.notes } : {}),
    ...(isString(value.appliedAt) ? { appliedAt: value.appliedAt } : {}),
  };
}

function parseListResponse(value: unknown): ApplicationListResponse {
  if (!isRecord(value) || !Array.isArray(value.data) || !isRecord(value.pagination)) {
    throw new Error("Invalid application list response.");
  }

  const { page, limit, total, totalPages } = value.pagination;

  if (!isNumber(page) || !isNumber(limit) || !isNumber(total) || !isNumber(totalPages)) {
    throw new Error("Invalid application pagination response.");
  }

  return {
    data: value.data.map(parseApplication),
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
  };
}

function parseStats(value: unknown): ApplicationStats {
  if (!isRecord(value) || !isRecord(value.countsByStatus)) {
    throw new Error("Invalid application stats response.");
  }

  const { total, active, interviews, offers } = value;
  if (!isNumber(total) || !isNumber(active) || !isNumber(interviews) || !isNumber(offers)) {
    throw new Error("Invalid application stats response.");
  }

  const { countsByStatus } = value;
  const counts = applicationStatuses.reduce<ApplicationStats["countsByStatus"]>(
    (result, status) => {
      const count = countsByStatus[status];
      if (!isNumber(count)) throw new Error("Invalid application stats response.");
      return {
        ...result,
        [status]: count,
      };
    },
    {
      saved: 0,
      applied: 0,
      screening: 0,
      assessment: 0,
      interview: 0,
      offer: 0,
      rejected: 0,
      withdrawn: 0,
    },
  );

  return {
    active,
    countsByStatus: counts,
    interviews,
    offers,
    total,
  };
}

function toSearchParams(params: ApplicationListParams): string {
  const searchParams = new URLSearchParams();

  if (Array.isArray(params.status)) {
    for (const status of params.status) {
      searchParams.append("status", status);
    }
  } else if (params.status !== undefined) {
    searchParams.set("status", params.status);
  }
  if (params.search !== undefined && params.search.trim()) {
    searchParams.set("search", params.search.trim());
  }
  if (params.sortBy !== undefined) searchParams.set("sortBy", params.sortBy);
  if (params.sortOrder !== undefined) searchParams.set("sortOrder", params.sortOrder);
  if (params.page !== undefined) searchParams.set("page", String(params.page));
  if (params.limit !== undefined) searchParams.set("limit", String(params.limit));

  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

export async function listApplicationsRequest(
  params: ApplicationListParams,
  signal?: AbortSignal,
): Promise<ApplicationListResponse> {
  const response = await apiRequest<unknown>(
    `/api/applications${toSearchParams(params)}`,
    { signal },
  );

  return parseListResponse(response);
}

export async function getApplicationStatsRequest(
  signal?: AbortSignal,
): Promise<ApplicationStats> {
  const response = await apiRequest<unknown>("/api/applications/stats", { signal });
  return parseStats(response);
}

export async function getApplicationRequest(
  id: string,
  signal?: AbortSignal,
): Promise<JobApplication> {
  const response = await apiRequest<unknown>(`/api/applications/${id}`, { signal });
  return parseApplication(response);
}

export async function createApplicationRequest(
  input: ApplicationFormInput,
): Promise<JobApplication> {
  const response = await apiRequest<unknown>("/api/applications", {
    body: input,
    method: "POST",
  });
  return parseApplication(response);
}

export async function updateApplicationRequest({
  id,
  input,
}: {
  id: string;
  input: Partial<ApplicationFormInput>;
}): Promise<JobApplication> {
  const response = await apiRequest<unknown>(`/api/applications/${id}`, {
    body: input,
    method: "PATCH",
  });
  return parseApplication(response);
}

export async function deleteApplicationRequest(id: string): Promise<void> {
  await apiRequest<null>(`/api/applications/${id}`, {
    method: "DELETE",
  });
}
