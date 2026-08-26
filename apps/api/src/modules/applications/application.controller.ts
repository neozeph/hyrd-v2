import type { Request, Response } from "express";
import {
  applicationIdSchema,
  createApplicationSchema,
  updateApplicationSchema,
  listApplicationsQuerySchema,
} from "./application.schema.js";

import {
  createApplication,
  deleteApplication,
  getApplicationById,
  listApplications,
  updateApplication,
} from "./application.service.js";

export async function getApplications(
  request: Request,
  response: Response,
): Promise<void> {
  const query = listApplicationsQuerySchema.parse(request.query);

  const result = await listApplications(query);

  response.status(200).json(result);
}

export async function postApplication(
  request: Request,
  response: Response,
): Promise<void> {
  const input = createApplicationSchema.parse(request.body);

  const application = await createApplication(input);

  response.status(201).json(application);
}

export async function getApplication(
  request: Request,
  response: Response,
): Promise<void> {
  const id = applicationIdSchema.parse(request.params.id);
  const application = await getApplicationById(id);

  if (!application) {
    response.status(404).json({
      error: "Application not found",
    });
    return;
  }

  response.status(200).json(application);
}

export async function patchApplication(
  request: Request,
  response: Response,
): Promise<void> {
  const id = applicationIdSchema.parse(request.params.id);

  const input = updateApplicationSchema.parse(request.body);

  const application = await updateApplication(id, input);

  if (!application) {
    response.status(404).json({
      error: "Application not found",
    });
    return;
  }

  response.status(200).json(application);
}

export async function removeApplication(
  request: Request,
  response: Response,
): Promise<void> {
  const id = applicationIdSchema.parse(request.params.id);

  const wasDeleted = await deleteApplication(id);

  if (!wasDeleted) {
    response.status(404).json({
      error: "Application not found",
    });
    return;
  }

  response.status(204).send();
}
