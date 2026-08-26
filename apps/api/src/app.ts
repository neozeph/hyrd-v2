import express from "express";
import { applicationRouter } from "./modules/applications/application.routes.js";

export const app = express();

app.disable("x-powered-by");
app.use(express.json());

app.use("/api/applications", applicationRouter);

app.get("/api/health", (_request, response) => {
  response.status(200).json({
    status: "ok",
    service: "hyrd-api",
  });
});
