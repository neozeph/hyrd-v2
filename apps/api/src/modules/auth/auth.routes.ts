import { Router } from "express";

import { getCurrentUser, login, logout, register } from "./auth.controller.js";

import { requireAuthentication } from "./auth.middleware.js";

export const authRouter = Router();

authRouter.post("/register", register);
authRouter.post("/login", login);
authRouter.post("/logout", logout);
authRouter.get("/me", requireAuthentication, getCurrentUser);
