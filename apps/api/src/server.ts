import { app } from "./app.js";
import { env } from "./config/env.js";
import { prisma } from "./lib/prisma.js";

const server = app.listen(env.PORT, () => {
  console.log(`Hyrd API is running at http://localhost:${env.PORT}`);
});

let isShuttingDown = false;

async function shutdown(signal: string): Promise<void> {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;

  console.log(`Received ${signal}. Shutting down.`);

  server.close(async (error) => {
    try {
      if (error) {
        throw error;
      }

      await prisma.$disconnect();

      console.log("Hyrd API stopped cleanly.");
      process.exit(0);
    } catch (shutdownError: unknown) {
      console.error("Failed to shut down cleanly:", shutdownError);

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
