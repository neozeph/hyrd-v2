import {
  addApplication,
  deleteApplicationById,
  getApplicationStats,
  findApplicationById,
  getAllApplications,
  updateApplicationById,
} from "./application.repository.js";

import type { ListApplicationsQuery } from "./application.schema.js";

import type {
  ApplicationListResult,
  ApplicationStats,
  CreateApplicationInput,
  JobApplication,
  UpdateApplicationInput,
} from "./application.types.js";

export async function listApplications(
  userId: string,
  query: ListApplicationsQuery,
): Promise<ApplicationListResult> {
  return getAllApplications(userId, query);
}

export async function getApplicationsStats(
  userId: string,
): Promise<ApplicationStats> {
  return getApplicationStats(userId);
}

export async function createApplication(
  userId: string,
  input: CreateApplicationInput,
): Promise<JobApplication> {
  return addApplication(userId, input);
}

export async function getApplicationById(
  userId: string,
  id: string,
): Promise<JobApplication | undefined> {
  return findApplicationById(userId, id);
}

export async function updateApplication(
  userId: string,
  id: string,
  input: UpdateApplicationInput,
): Promise<JobApplication | undefined> {
  return updateApplicationById(userId, id, input);
}

export async function deleteApplication(
  userId: string,
  id: string,
): Promise<boolean> {
  return deleteApplicationById(userId, id);
}
