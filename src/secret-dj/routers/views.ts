import express from "express";
import { checkParticipation, enforceParticipation } from "../middlewares/checkParticipation";
import { createParticipant } from "../operations/createParticipant";
import { Email } from "@prisma/client";
import { signupPayloadSchema } from "../schemas";

export const views = express()
	.use(checkParticipation)
	// TODO if participating, just redirect
	.get("/signup", (req, res) => res.render("pages/secret-dj/signup", { error: "" }))
	.post("/signup", async (req, res) => {
		try {
			const email: Email = res.locals.email;
			const { name } = signupPayloadSchema.parse(req.body);
			await createParticipant({ emailId: email.id, name });
			return res.redirect("/secret-dj");
		} catch (error) {
			return res.render("pages/secret-dj/signup", { error: "that didn't quite work" });
		}
	})
	.get("/browse", (req, res) => {
		// TODO this is where we see all games that we haven't signed up for yet
		return res.redirect("/secret-dj"); // TODO
	})
	.get("/games/:id", (req, res) => {
		// TODO
		// 1. if the game is not started,
		//     you should see a form for your rules
		//     even if you have already signed up (it's essentially a put)
		//     if you already signed up, there's a link that says "comments" that goes to /games/id/entries/id
		//   beneath is a table with everyone else's rules and also links to /games/id/entries/id
		//  ALSO if you are the admin of the game, there should be a start button and a delete button
		// 2. if the game IS started,
		//     you should see your recipient's rules, as well as a form for the playlist
		//     there's a link that says "comments" that goes to /games/id/entries/id
		//    beneath is a table with everyone else's rules and also links to /games/id/entries/id
		// 3. if the game is DONE, you should see the playlist you received at the top
		//    beneath is a table with everyone else's rules and playlist links!
		return res.redirect("/secret-dj"); // TODO
	})
	.post("/games/:id/rules", (req, res) => {
		// This is for signing up or editing your rules
		// Fails if the game is started or ended
		return res.redirect("/secret-dj");
	})
	.post("/games/:id/playlist", (req, res) => {
		// This is for submitting your playlist
		// Fails if the game is not in progress
		return res.redirect("/secret-dj");
	})
	.post("/games/:id/start", (req, res) => res.redirect("/secret-dj"))
	.post("/games/:id/delete", (req, res) => res.redirect("/secret-dj"))
	.get("/create", (req, res) => res.redirect("/secret-dj"))
	.post("/create", (req, res) => {
		// game count, name
		// STRETCH GOAL??? add a description field
		return res.redirect("/secret-dj");
	})
	.get("/games/:id/entries/:entry", (req, res) => {
		// TODO
		// we see the rules, the recipient name, the playlist embedded, and a comment box
		// if the game has not yet ended, the playlist is not embedded
		// the comment box does NOT show the form entry for name (anon only)
		// STRETCH GOAL??? is the playlist information saved in the database?
		return res.redirect("/secret-dj"); // TODO
	})
	.use("/*", enforceParticipation)
	.get("/", async (req, res) => {
		return res.render("pages/secret-dj/index", {
			locals: res.locals,
		});
	});
