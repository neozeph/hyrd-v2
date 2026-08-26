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

export type UpdateApplicationInput = {
  [Key in keyof CreateApplicationInput]?:
    | CreateApplicationInput[Key]
    | undefined;
}; // partial = makes props optional

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
