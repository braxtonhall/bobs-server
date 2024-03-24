import express from "express";
import { apiRouter } from "./apiRouter";
import subdomain from "express-subdomain";

export const publicRouter = express.Router().use(subdomain("api", apiRouter));
