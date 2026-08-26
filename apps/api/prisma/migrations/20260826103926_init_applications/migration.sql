-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('saved', 'applied', 'screening', 'interview', 'assessment', 'offer', 'rejected', 'withdrawn');

-- CreateTable
CREATE TABLE "job_applications" (
    "id" UUID NOT NULL,
    "company" VARCHAR(200) NOT NULL,
    "position" VARCHAR(200) NOT NULL,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'saved',
    "location" VARCHAR(200),
    "job_url" TEXT,
    "notes" TEXT,
    "applied_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "job_applications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "job_applications_status_idx" ON "job_applications"("status");

-- CreateIndex
CREATE INDEX "job_applications_applied_at_idx" ON "job_applications"("applied_at");
