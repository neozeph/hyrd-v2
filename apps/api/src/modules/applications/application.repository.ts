import type {
  CreateApplicationInput,
  JobApplication,
  UpdateApplicationInput,
} from "./application.types.js";

import { prisma } from "../../lib/prisma.js";
import { toJobApplication } from "./application.mapper.js";

export async function getAllApplications(): Promise<JobApplication[]> {
  const records = await prisma.jobApplication.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });

  return records.map(toJobApplication);
}

export async function addApplication(
  input: CreateApplicationInput,
): Promise<JobApplication> {
  const record = await prisma.jobApplication.create({
    data: {
      company: input.company,
      position: input.position,
      status: input.status ?? "saved",

      ...(input.location !== undefined ? { location: input.location } : {}),

      ...(input.jobUrl !== undefined ? { jobUrl: input.jobUrl } : {}),

      ...(input.notes !== undefined ? { notes: input.notes } : {}),

      ...(input.appliedAt !== undefined
        ? { appliedAt: new Date(input.appliedAt) }
        : {}),
    },
  });

  return toJobApplication(record);
}

export async function findApplicationById(
  id: string,
): Promise<JobApplication | undefined> {
  const record = await prisma.jobApplication.findUnique({
    where: {
      id,
    },
  });

  return record ? toJobApplication(record) : undefined;
}

export async function updateApplicationById(
  id: string,
  updates: UpdateApplicationInput,
): Promise<JobApplication | undefined> {
  const existingRecord = await prisma.jobApplication.findUnique({
    where: {
      id,
    },
  });

  if (!existingRecord) {
    return undefined;
  }

  const updatedRecord = await prisma.jobApplication.update({
    where: {
      id,
    },
    data: {
      ...(updates.company !== undefined ? { company: updates.company } : {}),

      ...(updates.position !== undefined ? { position: updates.position } : {}),

      ...(updates.status !== undefined ? { status: updates.status } : {}),

      ...(updates.location !== undefined ? { location: updates.location } : {}),

      ...(updates.jobUrl !== undefined ? { jobUrl: updates.jobUrl } : {}),

      ...(updates.notes !== undefined ? { notes: updates.notes } : {}),

      ...(updates.appliedAt !== undefined
        ? { appliedAt: new Date(updates.appliedAt) }
        : {}),
    },
  });

  return toJobApplication(updatedRecord);
}

export async function deleteApplicationById(id: string): Promise<boolean> {
  const result = await prisma.jobApplication.deleteMany({
    where: {
      id,
    },
  });

  return result.count > 0;
}

export async function resetApplications(): Promise<void> {
  await prisma.jobApplication.deleteMany();
}
