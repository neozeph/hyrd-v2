export type ApplicationStatus =
  | "saved"
  | "applied"
  | "screening"
  | "interview"
  | "assessment"
  | "offer"
  | "rejected"
  | "withdrawn";

export type UpdateApplicationInput = Partial<CreateApplicationInput>; // partial = makes props optional

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

export interface CreateApplicationInput {
  company: string;
  position: string;
  status?: ApplicationStatus;
  location?: string;
  jobUrl?: string;
  notes?: string;
  appliedAt?: string;
}
