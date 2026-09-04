export const applicationStatuses = [
  "saved",
  "applied",
  "screening",
  "assessment",
  "interview",
  "offer",
  "rejected",
  "withdrawn",
] as const;

export type ApplicationStatus = (typeof applicationStatuses)[number];

export interface JobApplication {
  id: string;
  company: string;
  position: string;
  status: ApplicationStatus;
  location?: string;
  jobUrl?: string;
  notes?: string;
  appliedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApplicationPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApplicationListResponse {
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
