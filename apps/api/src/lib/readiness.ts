import { logger } from "../config/logger.js";
import { prisma } from "./prisma.js";

export async function checkDatabaseReadiness(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error: unknown) {
    logger.error(
      {
        error,
      },
      "Database readiness check failed",
    );
    return false;
  }
}
