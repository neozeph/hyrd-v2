import express, { type RequestHandler } from "express";
import cors from "cors";
import helmet from "helmet";
import swaggerUi from "swagger-ui-express";
import cookieParser from "cookie-parser";

import { env, trustProxy } from "./config/env.js";
import { errorHandler } from "./middleware/error-handler.js";
import { notFoundHandler } from "./middleware/not-found.js";
import { applicationRouter } from "./modules/applications/application.routes.js";
import { httpLogger } from "./config/logger.js";
import { openApiDocument } from "./docs/openapi.js";
import { authRouter } from "./modules/auth/auth.routes.js";
import { validateUnsafeRequestOrigin } from "./middleware/origin.js";
import { requireCsrfToken } from "./middleware/csrf.js";
import { createRateLimit } from "./middleware/rate-limit.js";

export const app = express();

app.set("trust proxy", trustProxy);
app.disable("x-powered-by");
app.use(httpLogger);
app.use(helmet());

app.use(
  cors({
    origin: env.CLIENT_ORIGIN,
    credentials: true,
  }),
);

app.use(
  express.json({
    limit: "100kb",
  }),
);
app.use(cookieParser());

app.use(
  "/api",
  createRateLimit({
    keyPrefix: "general",
    limit: env.GENERAL_RATE_LIMIT_MAX,
    windowMs: 15 * 60 * 1000,
  }),
);
app.use(validateUnsafeRequestOrigin);
app.use(requireCsrfToken);

app.use("/api/applications", applicationRouter);
app.use("/api/auth", authRouter);

app.get("/api/health", (_request, response) => {
  response.status(200).json({
    status: "ok",
    service: "hyrd-api",
  });
});

const removeDocsContentSecurityPolicy: RequestHandler = (
  _request,
  response,
  next,
) => {
  response.removeHeader("Content-Security-Policy");
  next();
};
app.get("/api/docs.json", (_request, response) => {
  response.status(200).json(openApiDocument);
});
app.use(
  "/api/docs",
  removeDocsContentSecurityPolicy,
  swaggerUi.serve,
  swaggerUi.setup(openApiDocument),
);

app.use(notFoundHandler);
app.use(errorHandler);
