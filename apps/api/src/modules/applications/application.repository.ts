import type {
  JobApplication,
  UpdateApplicationInput,
} from "./application.types.js";

const applications: JobApplication[] = [];

export function getAllApplications(): JobApplication[] {
  return applications;
}

export function addApplication(application: JobApplication): JobApplication {
  applications.push(application);

  return application;
}

export function findApplicationById(id: string): JobApplication | undefined {
  return applications.find((application) => application.id === id);
}

export function updateApplicationById(
  id: string,
  updates: UpdateApplicationInput,
): JobApplication | undefined {
  const applicationIndex = applications.findIndex(
    (application) => application.id === id,
  );

  if (applicationIndex === -1) {
    return undefined;
  }

  const existingApplication = applications[applicationIndex];

  if (!existingApplication) {
    return undefined;
  }

  const updatedApplication: JobApplication = {
    ...existingApplication,
    ...updates,
    id: existingApplication.id,
    company: updates.company ?? existingApplication.company,
    position: updates.position ?? existingApplication.position,
    status: updates.status ?? existingApplication.status,
    createdAt: existingApplication.createdAt,
    updatedAt: new Date().toISOString(),
  };

  applications[applicationIndex] = updatedApplication;

  return updatedApplication;
}

export function deleteApplicationById(id: string): boolean {
  const applicationIndex = applications.findIndex(
    (application) => application.id === id,
  );

  if (applicationIndex === -1) {
    return false;
  }

  applications.splice(applicationIndex, 1);

  return true;
}

export function resetApplications(): void {
  applications.length = 0;
}
