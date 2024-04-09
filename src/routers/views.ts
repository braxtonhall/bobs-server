import express from "express";

export const views = express()
	.set("view engine", "ejs")
	.get("/", (req, res) => res.render("pages/index"));
