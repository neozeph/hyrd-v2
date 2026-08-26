import type { JobApplication as PrismaJobApplication } from "../../generated/prisma/client.js";

import type { JobApplication } from "./application.types.js";

export function toJobApplication(record: PrismaJobApplication): JobApplication {
  return {
    id: record.id,
    company: record.company,
    position: record.position,
    status: record.status,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),

    ...(record.location !== null ? { location: record.location } : {}),

    ...(record.jobUrl !== null ? { jobUrl: record.jobUrl } : {}),

    ...(record.notes !== null ? { notes: record.notes } : {}),

    ...(record.appliedAt !== null
      ? { appliedAt: record.appliedAt.toISOString() }
      : {}),
  };
}
