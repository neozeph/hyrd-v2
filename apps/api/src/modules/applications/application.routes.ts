import { Router } from "express";

import { requireAuthentication } from "../auth/auth.middleware.js";

import {
  getApplication,
  getApplicationStats,
  getApplications,
  patchApplication,
  postApplication,
  removeApplication,
} from "./application.controller.js";

export const applicationRouter = Router();

applicationRouter.use(requireAuthentication);

applicationRouter.get("/stats", getApplicationStats);
applicationRouter.get("/:id", getApplication);
applicationRouter.get("/", getApplications);
applicationRouter.post("/", postApplication);
applicationRouter.patch("/:id", patchApplication);
applicationRouter.delete("/:id", removeApplication);
