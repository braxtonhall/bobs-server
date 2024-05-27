import express from "express";
import { getParticipation, enforceParticipation, checkParticipation } from "../middlewares/checkParticipation";
import { setParticipant } from "../operations/setParticipant";
import { Email, Participant } from "@prisma/client";
import {
	createSeasonPayloadSchema,
	editSeasonPayloadSchema,
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
import { endFinishedSeasons } from "../operations/endFinishedSeasons";
import { editGame } from "../operations/editGame";

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
	.get("/games", async (req, res) => {
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
		const { seasons, cursor } = await getArchivedSeasons({
			cursor: typeof req.query.cursor === "string" ? req.query.cursor : undefined,
		});
		return res.render("pages/secret-dj/archive", { seasons, cursor, participantId });
	})
	.get("/games/:id", async (req, res) => {
		try {
			const participantId = res.locals.participant.id;
			const season = await getSeason(req.params.id);
			const { recipient, dj } = await getParticipantEntriesForSeason({
				seasonId: season.id,
				userId: participantId,
			});
			return res.render("pages/secret-dj/game", {
				error: typeof req.query.error === "string" ? req.query.error : "",
				success: typeof req.query.success === "string" ? req.query.success : "",
				season,
				participant: res.locals.participant,
				recipient,
				dj,
			});
		} catch {
			return res.sendStatus(404);
		}
	})
	.post("/games/:id/start", async (req, res) => {
		const seasonId = req.params.id;
		try {
			const ownerId = res.locals.participant.id;
			await startGame({ seasonId, ownerId });
			return res.redirect(`/secret-dj/games/${seasonId}?success=${encodeURIComponent("new game started!")}`);
		} catch {
			return res.redirect(`/secret-dj/games/${seasonId}?error=${encodeURIComponent("that did not work")}`);
		}
	})
	.post("/games/:id/delete", async (req, res) => {
		const seasonId = req.params.id;
		try {
			const ownerId = res.locals.participant.id;
			await deleteGame({ seasonId, ownerId });
			return res.redirect("/secret-dj");
		} catch {
			return res.redirect(`/secret-dj/games/${seasonId}?error=${encodeURIComponent("that did not work")}`);
		}
	})
	.post("/games/:id/edit", async (req, res) => {
		const seasonId = req.params.id;
		try {
			const { name, description } = editSeasonPayloadSchema.parse(req.body);
			const participant: Participant = res.locals.participant;
			await editGame({ name, description, seasonId, ownerId: participant.id });
			return res.redirect(`/secret-dj/games/${seasonId}?success=${encodeURIComponent("game data updated!")}`);
		} catch {
			return res.redirect(`/secret-dj/games/${seasonId}?error=${"that didn't quite work"}`);
		}
	})
	.post("/games/:id/rules", async (req, res) => {
		const seasonId = req.params.id;
		try {
			const { recipientId, rules } = submitRulesSchema.parse(req.body);
			if (await isParticipantRegisteredInGame({ seasonId, participantId: recipientId })) {
				await updateRules({ seasonId, recipientId, rules });
			} else {
				await enrolInGame({ seasonId, recipientId, rules });
			}
			return res.redirect(`/secret-dj/games/${seasonId}?success=${encodeURIComponent("game rules updated!")}`);
		} catch {
			return res.redirect(`/secret-dj/games/${seasonId}?error=${encodeURIComponent("that did not work")}`);
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
			// TODO remove or not lol
			await endFinishedSeasons();

			return res.redirect(`/secret-dj/games/${seasonId}?success=${encodeURIComponent("playlist submitted!")}`);
		} catch {
			return res.redirect(`/secret-dj/games/${req.params.id}?error=${encodeURIComponent("that did not work")}`);
		}
	})
	.get("/create", (req, res) => res.render("pages/secret-dj/create", { error: "" }))
	.post("/create", async (req, res) => {
		try {
			const { name, description, rules: ruleCount } = createSeasonPayloadSchema.parse(req.body);
			const participant: Participant = res.locals.participant;
			const id = await createGame({ name, description, ruleCount, ownerId: participant.id });
			return res.redirect(`games/${id}?success=${encodeURIComponent("new game created!")}`);
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
		res.render("pages/secret-dj/settings", {
			name: res.locals.participant.name,
			error: "",
			success: "",
		}),
	)
	.post("/settings", async (req, res) => {
		try {
			const { name } = settingsPayloadSchema.parse(req.body);
			const email: Email = res.locals.email;
			await setParticipant({ emailId: email.id, name });
			return res.render("pages/secret-dj/settings", { name, error: "", success: "saved" });
		} catch {
			return res.render("pages/secret-dj/settings", {
				name: res.locals.participant.name,
				error: "that didn't work",
				success: "",
			});
		}
	});
