import express from "express";
import { getParticipation, enforceParticipation, checkParticipation } from "../middlewares/checkParticipation";
import { setParticipant } from "../operations/setParticipant";
import { Email, Participant } from "@prisma/client";
import {
	createSeasonPayloadSchema,
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
import { SeasonState } from "../SeasonState";
import { endFinishedSeasons } from "../operations/endFinishedSeasons";

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
		res.render("pages/secret-dj/browse", { seasons, cursor, participantId });
	})
	.get("/", async (req, res) => {
		const participantId = res.locals.participant.id;
		const { seasons, cursor } = await getSeasonsForParticipant({
			participantId,
			cursor: typeof req.query.cursor === "string" ? req.query.cursor : undefined,
		});
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
		const { recipientId, rules } = submitRulesSchema.parse(req.body);
		const seasonId = req.params.id;
		try {
			const season = await getSeason(req.params.id);
			if (!(season.state === SeasonState.SIGN_UP)) {
				// TODO Fails if the game is started or ended
				// how to signal failure lol
				return res.redirect(`/secret-dj/games/${seasonId}`);
			}
			if (await isParticipantRegisteredInGame({ seasonId, participantId: recipientId })) {
				await updateRules({ seasonId, recipientId, rules });
			} else {
				await enrolInGame({ seasonId, recipientId, rules });
			}
			return res.redirect(`/secret-dj/games/${seasonId}`);
		} catch {
			// season doesn't exist anymore
			// error somehow
			return res.redirect(`/secret-dj`);
		}
	})
	.post("/games/:id/playlist", async (req, res) => {
		try {
			const seasonId = req.params.id;
			const { link } = submitPlaylistPayloadSchema.parse(req.body);
			await submitPlaylist({
				seasonId,
				playlistUrl: link,
				djId: res.locals.participant.id,
			});
			// TODO remove
			await endFinishedSeasons();

			return res.redirect(`/secret-dj/games/${seasonId}`);
		} catch {
			return res.redirect(`games/${req.params.id}?error=${encodeURIComponent("that did not work")}`);
		}
	})
	.post("/games/:id/start", async (req, res) => {
		const ownerId = res.locals.participant.id;
		const seasonId = req.params.id;
		await startGame({ seasonId, ownerId });
		res.redirect(`/secret-dj/games/${seasonId}`);
	})
	.post("/games/:id/delete", async (req, res) => {
		const ownerId = res.locals.participant.id;
		const seasonId = req.params.id;
		const season = await getSeason(seasonId);
		if (season.entries.length) {
			// TODO signal error somehow
			return res.redirect(`/secret-dj/games/${seasonId}`);
		}
		await deleteGame({ seasonId, ownerId });
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
