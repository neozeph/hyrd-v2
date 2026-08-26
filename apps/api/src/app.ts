import express from "express";
import cors from "cors";
import helmet from "helmet";

import { env } from "./config/env.js";
import { errorHandler } from "./middleware/error-handler.js";
import { notFoundHandler } from "./middleware/not-found.js";
import { applicationRouter } from "./modules/applications/application.routes.js";

export const app = express();

app.disable("x-powered-by");
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

app.use("/api/applications", applicationRouter);

app.get("/api/health", (_request, response) => {
  response.status(200).json({
    status: "ok",
    service: "hyrd-api",
  });
});

app.use(notFoundHandler);
app.use(errorHandler);
