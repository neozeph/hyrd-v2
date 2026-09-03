export type ApplicationStatus =
  | "saved"
  | "applied"
  | "screening"
  | "assessment"
  | "interview"
  | "offer"
  | "rejected"
  | "withdrawn";

export interface JobApplication {
  id: string;
  position: string;
  company: string;
  location: string;
  status: ApplicationStatus;
  appliedDate: string | null;
  lastUpdated: string;
  source: string;
  note: string;
}

