import type { Request, Response } from "express";
import {
  createApplicationSchema,
  updateApplicationSchema,
} from "./application.schema.js";

import {
  createApplication,
  deleteApplication,
  getApplicationById,
  listApplications,
  updateApplication,
} from "./application.service.js";

export function getApplications(_request: Request, response: Response): void {
  const applications = listApplications();

  response.status(200).json(applications);
}

export function postApplication(request: Request, response: Response): void {
  const input = createApplicationSchema.parse(request.body);

  const application = createApplication(input);

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

  const input = updateApplicationSchema.parse(request.body);

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
