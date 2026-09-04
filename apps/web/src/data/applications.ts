import type { ApplicationStatus } from "../types/application";

export const statusLabels: Record<ApplicationStatus, string> = {
  saved: "Saved",
  applied: "Applied",
  screening: "Screening",
  assessment: "Assessment",
  interview: "Interview",
  offer: "Offer",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
};

export const activeStatuses: ApplicationStatus[] = [
  "saved",
  "applied",
  "screening",
  "assessment",
  "interview",
  "offer",
];

export const closedStatuses: ApplicationStatus[] = ["rejected", "withdrawn"];
