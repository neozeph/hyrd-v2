import { Router } from "express";

import { getCurrentUser, login, logout, register } from "./auth.controller.js";
import { requireAuthentication } from "./auth.middleware.js";
import { issueCsrfToken } from "../../middleware/csrf.js";
import { createRateLimit } from "../../middleware/rate-limit.js";
import { env } from "../../config/env.js";

export const authRouter = Router();

const authRateLimit = createRateLimit({
  keyPrefix: "auth",
  limit: env.AUTH_RATE_LIMIT_MAX,
  windowMs: 15 * 60 * 1000,
});

authRouter.get("/csrf", issueCsrfToken);
authRouter.post("/register", authRateLimit, register);
authRouter.post("/login", authRateLimit, login);
authRouter.post("/logout", logout);
authRouter.get("/me", requireAuthentication, getCurrentUser);
