import { app } from "./app.js";
import { env } from "./config/env.js";
import { prisma } from "./lib/prisma.js";
import { logger } from "./config/logger.js";

const server = app.listen(env.PORT, () => {
  logger.info(
    {
      port: env.PORT,
    },
    "Hyrd API is running",
  );
});

let isShuttingDown = false;

async function shutdown(signal: string): Promise<void> {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;

  logger.info(
    {
      signal,
    },
    "Shutting down Hyrd API",
  );

  server.close(async (error) => {
    try {
      if (error) {
        throw error;
      }

      await prisma.$disconnect();

      logger.info("Hyrd API stopped cleanly");
      process.exit(0);
    } catch (shutdownError: unknown) {
      logger.error(
        {
          error: shutdownError,
        },
        "Failed to shut down cleanly",
      );

      process.exit(1);
    }
  });
}

process.on("SIGINT", () => {
  void shutdown("SIGINT");
});

process.on("SIGTERM", () => {
  void shutdown("SIGTERM");
});
