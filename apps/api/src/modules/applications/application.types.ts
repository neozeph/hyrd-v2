export const APPLICATION_STATUSES = [
  "saved",
  "applied",
  "screening",
  "interview",
  "assessment",
  "offer",
  "rejected",
  "withdrawn",
] as const;

export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export interface UpdateApplicationInput {
  company?: string | undefined;
  position?: string | undefined;
  status?: ApplicationStatus | undefined;
  location?: string | null | undefined;
  jobUrl?: string | null | undefined;
  notes?: string | null | undefined;
  appliedAt?: string | null | undefined;
}

export interface JobApplication {
  id: string;
  company: string;
  position: string;
  status: ApplicationStatus;
  location?: string | undefined;
  jobUrl?: string | undefined;
  notes?: string | undefined;
  appliedAt?: string | undefined;
  createdAt: string;
  updatedAt: string;
}

export interface CreateApplicationInput {
  company: string;
  position: string;
  status?: ApplicationStatus | undefined;
  location?: string | undefined;
  jobUrl?: string | undefined;
  notes?: string | undefined;
  appliedAt?: string | undefined;
}

export interface ApplicationPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApplicationListResult {
  data: JobApplication[];
  pagination: ApplicationPagination;
}

export type ApplicationStatusCounts = Record<ApplicationStatus, number>;

export interface ApplicationStats {
  total: number;
  active: number;
  interviews: number;
  offers: number;
  countsByStatus: ApplicationStatusCounts;
}
