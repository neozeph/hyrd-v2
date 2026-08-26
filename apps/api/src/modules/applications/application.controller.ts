import type { Request, Response } from "express";

import {
  createApplication,
  deleteApplication,
  getApplicationById,
  listApplications,
  updateApplication,
} from "./application.service.js";

import type {
  ApplicationStatus,
  CreateApplicationInput,
  UpdateApplicationInput,
} from "./application.types.js";

export function getApplications(_request: Request, response: Response): void {
  const applications = listApplications();

  response.status(200).json(applications);
}

const validStatuses: ApplicationStatus[] = [
  "saved",
  "applied",
  "screening",
  "interview",
  "assessment",
  "offer",
  "rejected",
  "withdrawn",
];

export function postApplication(request: Request, response: Response): void {
  const input = request.body as Partial<CreateApplicationInput>;

  if (typeof input.company !== "string" || input.company.trim() === "") {
    response.status(400).json({
      error: "Company is required",
    });
    return;
  }

  if (typeof input.position !== "string" || input.position.trim() === "") {
    response.status(400).json({
      error: "Position is required",
    });
    return;
  }

  if (input.status !== undefined && !validStatuses.includes(input.status)) {
    response.status(400).json({
      error: "Invalid application status",
    });
    return;
  }

  const application = createApplication({
    ...input,
    company: input.company.trim(),
    position: input.position.trim(),
  });

  response.status(201).json(application);
}

export function getApplication(request: Request, response: Response): void {
  const id = request.params.id;

  if (typeof id !== "string" || id.trim() === "") {
    // type narrowing
    response.status(400).json({
      error: "Application ID is required",
    });
    return;
  }

  const application = getApplicationById(id);

  if (!application) {
    response.status(404).json({
      error: "Application not found",
    });
    return;
  }

  response.status(200).json(application);
}

export function patchApplication(request: Request, response: Response): void {
  const id = request.params.id;

  if (typeof id !== "string" || id.trim() === "") {
    response.status(400).json({
      error: "Application ID is required",
    });
    return;
  }

  const input = (request.body ?? {}) as UpdateApplicationInput;

  if (
    input.company !== undefined &&
    (typeof input.company !== "string" || input.company.trim() === "")
  ) {
    response.status(400).json({
      error: "Company cannot be empty",
    });
    return;
  }

  if (
    input.position !== undefined &&
    (typeof input.position !== "string" || input.position.trim() === "")
  ) {
    response.status(400).json({
      error: "Position cannot be empty",
    });
    return;
  }

  if (input.status !== undefined && !validStatuses.includes(input.status)) {
    response.status(400).json({
      error: "Invalid application status",
    });
    return;
  }

  const application = updateApplication(id, input);

  if (!application) {
    response.status(404).json({
      error: "Application not found",
    });
    return;
  }

  response.status(200).json(application);
}

export function removeApplication(request: Request, response: Response): void {
  const id = request.params.id;

  if (typeof id !== "string" || id.trim() === "") {
    response.status(400).json({
      error: "Application ID is required",
    });
    return;
  }

  const wasDeleted = deleteApplication(id);

  if (!wasDeleted) {
    response.status(404).json({
      error: "Application not found",
    });
    return;
  }

  response.status(204).send();
}
