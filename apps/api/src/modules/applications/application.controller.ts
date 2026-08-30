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

function getAuthenticatedUserId(request: Request): string {
  const userId = request.authUser?.id;

  if (userId === undefined) {
    throw new Error("Authenticated user missing from request");
  }

  return userId;
}

export async function getApplications(
  request: Request,
  response: Response,
): Promise<void> {
  const query = listApplicationsQuerySchema.parse(request.query);

  const userId = getAuthenticatedUserId(request);
  const result = await listApplications(userId, query);

  response.status(200).json(result);
}

export async function postApplication(
  request: Request,
  response: Response,
): Promise<void> {
  const input = createApplicationSchema.parse(request.body);

  const userId = getAuthenticatedUserId(request);
  const application = await createApplication(userId, input);

  response.status(201).json(application);
}

export async function getApplication(
  request: Request,
  response: Response,
): Promise<void> {
  const id = applicationIdSchema.parse(request.params.id);
  const userId = getAuthenticatedUserId(request);
  const application = await getApplicationById(userId, id);

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

  const userId = getAuthenticatedUserId(request);
  const application = await updateApplication(userId, id, input);

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

  const userId = getAuthenticatedUserId(request);
  const wasDeleted = await deleteApplication(userId, id);

  if (!wasDeleted) {
    response.status(404).json({
      error: "Application not found",
    });
    return;
  }

  response.status(204).send();
}
