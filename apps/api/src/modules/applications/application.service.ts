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
// import { randomUUID } from "node:crypto";

export async function listApplications(): Promise<JobApplication[]> {
  return getAllApplications();
}

export async function createApplication(
  input: CreateApplicationInput,
): Promise<JobApplication> {
  return addApplication(input);
}

export async function getApplicationById(
  id: string,
): Promise<JobApplication | undefined> {
  return findApplicationById(id);
}

export async function updateApplication(
  id: string,
  input: UpdateApplicationInput,
): Promise<JobApplication | undefined> {
  return updateApplicationById(id, input);
}

export async function deleteApplication(id: string): Promise<boolean> {
  return deleteApplicationById(id);
}
