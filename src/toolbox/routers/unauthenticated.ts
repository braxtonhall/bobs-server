// import express from "express";
// import subdomain from "express-subdomain";
import { api } from "./api";
import { views } from "./views";

// const unauthenticated = express().use(subdomain("api", api)).use(views);

export { api, views };
