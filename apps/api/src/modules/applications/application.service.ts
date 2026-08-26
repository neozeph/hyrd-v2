import {
  addApplication,
  findApplicationById,
  getAllApplications,
  updateApplicationById,
  deleteApplicationById,
} from "./application.repository.js";

import type {
  CreateApplicationInput,
  JobApplication,
  UpdateApplicationInput,
} from "./application.types.js";
import { randomUUID } from "node:crypto";

export function listApplications(): JobApplication[] {
  return getAllApplications();
}

export function createApplication(
  input: CreateApplicationInput,
): JobApplication {
  const timestamp = new Date().toISOString();

  const application: JobApplication = {
    ...input,
    id: randomUUID(),
    status: input.status ?? "saved",
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  return addApplication(application);
}

export function getApplicationById(id: string): JobApplication | undefined {
  return findApplicationById(id);
}

export function updateApplication(
  id: string,
  input: UpdateApplicationInput,
): JobApplication | undefined {
  return updateApplicationById(id, input);
}

export function deleteApplication(id: string): boolean {
  return deleteApplicationById(id);
}
