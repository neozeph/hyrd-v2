import pino from "pino";
import { pinoHttp } from "pino-http";

import { env } from "./env.js";

export const logger = pino({
  level: env.NODE_ENV === "test" ? "silent" : env.LOG_LEVEL,

  redact: {
    paths: [
      "req.headers.authorization",
      "req.headers.cookie",
      "res.headers.set-cookie",
    ],
    censor: "[REDACTED]",
  },
});

export const httpLogger = pinoHttp({
  logger,
  autoLogging: env.NODE_ENV !== "test",
});
