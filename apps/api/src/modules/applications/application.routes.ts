import { Router } from "express";

import {
  getApplication,
  getApplications,
  patchApplication,
  postApplication,
  removeApplication,
} from "./application.controller.js";

export const applicationRouter = Router();

applicationRouter.get("/:id", getApplication);
applicationRouter.get("/", getApplications);
applicationRouter.post("/", postApplication);
applicationRouter.patch("/:id", patchApplication);
applicationRouter.delete("/:id", removeApplication);
