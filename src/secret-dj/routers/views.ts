import express from "express";
import { getParticipation, enforceParticipation, checkParticipation } from "../middlewares/checkParticipation";
import { setParticipant } from "../operations/setParticipant";
import { Email, Participant } from "@prisma/client";
import {
	createSeasonPayloadSchema,
	deleteOrStartSeasonPayloadSchema,
	settingsPayloadSchema,
	signupPayloadSchema,
	submitPlaylistPayloadSchema,
	submitRulesSchema,
} from "../schemas";
import { getJoinableGames } from "../operations/getJoinableGames";
import { getSeasonsForParticipant } from "../operations/getSeasonsForParticipant";
import { getArchivedSeasons } from "../operations/getArchivedSeasons";
import { createGame } from "../operations/createGame";
import { getSeason } from "../operations/getSeason";
import { getParticipantEntriesForSeason } from "../operations/getParticipantEntriesForSeason";
import { getEntry } from "../operations/getEntry";
import { submitPlaylist } from "../operations/submitPlaylist";
import { deleteGame } from "../operations/deleteGame";
import { startGame } from "../operations/startGame";
import { enrolInGame } from "../operations/enrolInGame";
import { isParticipantRegisteredInGame } from "../operations/isParticipantRegisteredInGame";
import { updateRules } from "../operations/updateRules";

export const views = express()
	.use(getParticipation)
	.get("/signup", checkParticipation, (req, res) => res.render("pages/secret-dj/signup", { error: "" }))
	.post("/signup", checkParticipation, async (req, res) => {
		try {
			const email: Email = res.locals.email;
			const { name } = signupPayloadSchema.parse(req.body);
			await setParticipant({ emailId: email.id, name });
			return res.redirect(req.originalUrl);
		} catch (error) {
			return res.render("pages/secret-dj/signup", { error: "that didn't quite work" });
		}
	})
	.use(enforceParticipation)
	.get("/browse", async (req, res) => {
		const participantId = res.locals.participant.id;
		const { seasons, cursor } = await getJoinableGames({
			participantId,
			cursor: typeof req.query.cursor === "string" ? req.query.cursor : undefined,
		});
		console.log({ seasons });
		res.render("pages/secret-dj/browse", { seasons, cursor, participantId });
	})
	.get("/", async (req, res) => {
		const participantId = res.locals.participant.id;
		const { seasons, cursor } = await getSeasonsForParticipant({
			participantId,
			cursor: typeof req.query.cursor === "string" ? req.query.cursor : undefined,
		});
		console.log({ seasons });
		return res.render("pages/secret-dj/index", { seasons, cursor, participantId });
	})
	.get("/archive", async (req, res) => {
		const participantId = res.locals.participant.id;
		const { seasons, cursor } = await getArchivedSeasons(req.query);
		res.render("pages/secret-dj/archive", { seasons, cursor, participantId });
	})
	.get("/games/:id", async (req, res) => {
		const participantId = res.locals.participant.id;
		try {
			const season = await getSeason(req.params.id);
			const { recipient, dj } = await getParticipantEntriesForSeason({
				seasonId: season.id,
				userId: participantId,
			});
			return res.render("pages/secret-dj/game", {
				error: "",
				season,
				participant: res.locals.participant,
				recipient,
				dj,
			});
		} catch {
			return res.sendStatus(404);
		}
	})
	.post("/games/:id/rules", async (req, res) => {
		// TODO Fails if the game is started or ended
		const { seasonId, recipientId, rules } = submitRulesSchema.parse(req.body);
		if (await isParticipantRegisteredInGame({ seasonId, participantId: recipientId })) {
			updateRules({ seasonId, recipientId, rules });
		} else {
			enrolInGame({ seasonId, recipientId, rules });
		}
		return res.redirect(`/secret-dj/games/${seasonId}`);
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
	.post("/games/:id/start", (req, res) => {
		const { seasonId, ownerId } = deleteOrStartSeasonPayloadSchema.parse(req.body);
		startGame({ seasonId, ownerId });
		res.redirect(`/secret-dj/games/${seasonId}`);
	})
	.post("/games/:id/delete", (req, res) => {
		const { seasonId, ownerId } = deleteOrStartSeasonPayloadSchema.parse(req.body);
		deleteGame({ seasonId, ownerId });
		res.redirect("/secret-dj");
	})
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
	});
