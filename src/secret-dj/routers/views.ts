import express from "express";
import { getParticipation, enforceParticipation, checkParticipation } from "../middlewares/checkParticipation";
import { setParticipant } from "../operations/setParticipant";
import { Email, Participant } from "@prisma/client";
import {
	createSeasonPayloadSchema,
	settingsPayloadSchema,
	signupPayloadSchema,
	submitPlaylistPayloadSchema,
} from "../schemas";
import { getJoinableGames } from "../operations/getJoinableGames";
import { getSeasonsForParticipant } from "../operations/getSeasonsForParticipant";
import { getArchivedSeasons } from "../operations/getArchivedSeasons";
import { createGame } from "../operations/createGame";
import { getSeason } from "../operations/getSeason";
import { getParticipantEntriesForSeason } from "../operations/getParticipantEntriesForSeason";
import { getEntry } from "../operations/getEntry";
import { submitPlaylist } from "../operations/submitPlaylist";

export const views = express()
	.use(getParticipation)
	.get("/signup", checkParticipation, (req, res) => res.render("pages/secret-dj/signup", { error: "" }))
	.post("/signup", checkParticipation, async (req, res) => {
		try {
			const email: Email = res.locals.email;
			const { name } = signupPayloadSchema.parse(req.body);
			await setParticipant({ emailId: email.id, name });
			return res.redirect("back");
		} catch (error) {
			return res.render("pages/secret-dj/signup", { error: "that didn't quite work" });
		}
	})
	.use(enforceParticipation)
	.get("/browse", async (req, res) =>
		res.render(
			"pages/secret-dj/browse",
			await getJoinableGames({
				participantId: res.locals.participant.id,
				cursor: typeof req.query.cursor === "string" ? req.query.cursor : undefined,
			}),
		),
	)
	.get("/archive", async (req, res) => res.render("pages/secret-dj/archive", await getArchivedSeasons(req.query)))
	.get("/games/:id", async (req, res) => {
		try {
			const season = await getSeason(req.params.id);
			return res.render("pages/secret-dj/game", {
				error: "",
				...req.query,
				season,
				participant: res.locals.participant,
				...(await getParticipantEntriesForSeason({ seasonId: season.id, userId: res.locals.participant.id })),
			});
		} catch {
			return res.sendStatus(404);
		}
	})
	.post("/games/:id/rules", (req, res) => {
		// TODO This is for signing up or editing your rules
		// Fails if the game is started or ended
		// TODO can we combine createEntry with updateEntry?
		return res.redirect("/secret-dj");
	})
	.post("/games/:id/playlist", async (req, res) => {
		try {
			const { link } = submitPlaylistPayloadSchema.parse(req.body);
			await submitPlaylist({
				seasonId: req.params.id,
				playlistUrl: link,
				djId: res.locals.participant.id,
			});
		} catch {
			return res.redirect(`games/${req.params.id}?error=${encodeURIComponent("that did not work")}`);
		}
	})
	.post("/games/:id/start", (req, res) => res.redirect("/secret-dj"))
	.post("/games/:id/delete", (req, res) => res.redirect("/secret-dj"))
	.get("/create", (req, res) => res.render("pages/secret-dj/create", { error: "" }))
	.post("/create", async (req, res) => {
		try {
			const { name, description, rules: ruleCount } = createSeasonPayloadSchema.parse(req.body);
			const participant: Participant = res.locals.participant;
			const id = await createGame({ name, description, ruleCount, ownerId: participant.id });
			return res.redirect(`games/${id}`);
		} catch {
			return res.render("pages/secret-dj/create", { error: "That didn't quite work" });
		}
	})
	.get("/games/:seasonId/entries/:entryId", async (req, res) => {
		try {
			const entry = await getEntry(req.params);
			return res.render("pages/secret-dj/entry", { entry, participant: res.locals.participant });
		} catch {
			return res.sendStatus(404);
		}
	})
	.get("/settings", (req, res) =>
		res.render("pages/secret-dj/settings", { name: res.locals.participant.name, message: "" }),
	)
	.post("/settings", async (req, res) => {
		try {
			const { name } = settingsPayloadSchema.parse(req.body);
			const email: Email = res.locals.email;
			await setParticipant({ emailId: email.id, name });
			return res.render("pages/secret-dj/settings", { name, message: "saved" });
		} catch {
			return res.render("pages/secret-dj/settings", {
				name: res.locals.participant.name,
				message: "that didn't work",
			});
		}
	})
	.get("/", async (req, res) =>
		res.render(
			"pages/secret-dj/index",
			await getSeasonsForParticipant({
				participantId: res.locals.participant.id,
				cursor: typeof req.query.cursor === "string" ? req.query.cursor : undefined,
			}),
		),
	);
