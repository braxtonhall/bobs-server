import express from "express";
import { getParticipation, enforceParticipation, checkParticipation } from "../middlewares/checkParticipation";
import { createParticipant } from "../operations/createParticipant";
import { Email } from "@prisma/client";
import { signupPayloadSchema } from "../schemas";
import { getJoinableGames } from "../operations/getJoinableGames";
import { getSeasonsForParticipant } from "../operations/getSeasonsForParticipant";
import { getArchivedSeasons } from "../operations/getArchivedSeasons";

export const views = express()
	.use(getParticipation)
	.get("/signup", checkParticipation, (req, res) => res.render("pages/secret-dj/signup", { error: "" }))
	.post("/signup", checkParticipation, async (req, res) => {
		try {
			const email: Email = res.locals.email;
			const { name } = signupPayloadSchema.parse(req.body);
			await createParticipant({ emailId: email.id, name });
			return res.redirect("back");
		} catch (error) {
			return res.render("pages/secret-dj/signup", { error: "that didn't quite work" });
		}
	})
	.use(enforceParticipation)
	.get("/browse", async (req, res) => {
		// TODO get the cursor from the query
		// const cursor = req.query.cursor;
		return res.render(
			"pages/secret-dj/browse",
			await getJoinableGames({ participantId: res.locals.participant.id }),
		);
	})
	.get("/archive", async (req, res) => {
		// TODO get the cursor from the query
		return res.render("pages/secret-dj/browse", await getArchivedSeasons({}));
	})
	.get("/games/:id", async (req, res) => {
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
	.get("/create", (req, res) => res.render("pages/secret-dj/create"))
	.post("/create", (req, res) => {
		// game count, name
		// STRETCH GOAL??? add a description field
		// at the end, redirect to the game page
		return res.redirect("/secret-dj");
	})
	.get("/games/:gameId/entries/:entryId", (req, res) => {
		// TODO
		// we see the rules, the recipient name, the playlist embedded, and a comment box
		// if the game has not yet ended, the playlist is not embedded
		// the comment box does NOT show the form entry for name (anon only)
		// STRETCH GOAL??? is the playlist information saved in the database?
		return res.redirect("/secret-dj"); // TODO
	})
	.get("/", async (req, res) => {
		return res.render(
			"pages/secret-dj/index",
			// TODO use the cursor
			await getSeasonsForParticipant({ participantId: res.locals.participant.id }),
		);
	});
