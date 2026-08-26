import { prisma } from "../lib/prisma.js";

async function main(): Promise<void> {
  const applicationCount = await prisma.jobApplication.count();

  console.log(`Database connected. Applications: ${applicationCount}`);
}

main()
  .catch((error: unknown) => {
    console.error("Database connection failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
