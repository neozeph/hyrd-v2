import type {
  ApplicationListResult,
  CreateApplicationInput,
  JobApplication,
  UpdateApplicationInput,
} from "./application.types.js";

import { prisma } from "../../lib/prisma.js";
import { toJobApplication } from "./application.mapper.js";
import type { Prisma } from "../../generated/prisma/client.js";

import type { ListApplicationsQuery } from "./application.schema.js";

export async function getAllApplications(
  userId: string,
  query: ListApplicationsQuery,
): Promise<ApplicationListResult> {
  const { status, search, sortBy, sortOrder, page, limit } = query;

  const where: Prisma.JobApplicationWhereInput = {
    userId,

    ...(status !== undefined ? { status } : {}),

    ...(search !== undefined
      ? {
          OR: [
            {
              company: {
                contains: search,
                mode: "insensitive",
              },
            },
            {
              position: {
                contains: search,
                mode: "insensitive",
              },
            },
          ],
        }
      : {}),
  };

  let orderBy: Prisma.JobApplicationOrderByWithRelationInput;

  switch (sortBy) {
    case "company":
      orderBy = {
        company: sortOrder,
      };
      break;

    case "appliedAt":
      orderBy = {
        appliedAt: sortOrder,
      };
      break;

    default:
      orderBy = {
        createdAt: sortOrder,
      };
  }

  const [records, total] = await prisma.$transaction([
    prisma.jobApplication.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
    }),

    prisma.jobApplication.count({
      where,
    }),
  ]);

  return {
    data: records.map(toJobApplication),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function addApplication(
  userId: string,
  input: CreateApplicationInput,
): Promise<JobApplication> {
  const record = await prisma.jobApplication.create({
    data: {
      userId,
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
  userId: string,
  id: string,
): Promise<JobApplication | undefined> {
  const record = await prisma.jobApplication.findFirst({
    where: {
      id,
      userId,
    },
  });

  return record ? toJobApplication(record) : undefined;
}

export async function updateApplicationById(
  userId: string,
  id: string,
  updates: UpdateApplicationInput,
): Promise<JobApplication | undefined> {
  const result = await prisma.jobApplication.updateMany({
    where: {
      id,
      userId,
    },

    data: {
      ...(updates.company !== undefined ? { company: updates.company } : {}),

      ...(updates.position !== undefined ? { position: updates.position } : {}),

      ...(updates.status !== undefined ? { status: updates.status } : {}),

      ...(updates.location !== undefined ? { location: updates.location } : {}),

      ...(updates.jobUrl !== undefined ? { jobUrl: updates.jobUrl } : {}),

      ...(updates.notes !== undefined ? { notes: updates.notes } : {}),

      ...(updates.appliedAt !== undefined
        ? {
            appliedAt: new Date(updates.appliedAt),
          }
        : {}),
    },
  });

  if (result.count === 0) {
    return undefined;
  }

  const updatedRecord = await prisma.jobApplication.findFirst({
    where: {
      id,
      userId,
    },
  });

  return updatedRecord ? toJobApplication(updatedRecord) : undefined;
}

export async function deleteApplicationById(
  userId: string,
  id: string,
): Promise<boolean> {
  const result = await prisma.jobApplication.deleteMany({
    where: {
      id,
      userId,
    },
  });

  return result.count > 0;
}

export async function resetApplications(): Promise<void> {
  await prisma.jobApplication.deleteMany();
}
