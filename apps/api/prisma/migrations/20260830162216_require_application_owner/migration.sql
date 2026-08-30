/*
  Warnings:

  - Made the column `userId` on table `job_applications` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "job_applications" ALTER COLUMN "userId" SET NOT NULL;
