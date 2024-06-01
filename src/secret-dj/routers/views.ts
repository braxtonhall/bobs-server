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
import { endFinishedSeasons } from "../operations/endFinishedSeasons";
import { editGame } from "../operations/editGame";
import Config from "../../Config";
import { getDjEntries } from "../operations/getDjEntries";
import { setRules } from "../operations/setRules";
import { leaveGame } from "../operations/leaveGame";
import { enforceLoggedIn } from "../../auth/middlewares/authenticate";
import { clearMessagesAndSet, getMessagesAndClear } from "./sessionUtils";

export const views = express()
	.use(getParticipation)
	.get("/signup", enforceLoggedIn, checkParticipation, (req, res) =>
		res.render("pages/secret-dj/signup", { error: "", Config }),
	)
	.post("/signup", enforceLoggedIn, checkParticipation, async (req, res) => {
		try {
			const email: Email = res.locals.email;
			const { name } = signupPayloadSchema.parse(req.body);
			await setParticipant({ emailId: email.id, name });
			return res.redirect(req.originalUrl);
		} catch (error) {
			return res.render("pages/secret-dj/signup", { error: "that didn't quite work", Config });
		}
	})
	.get("/games", async (req, res) => {
		const participantId = res.locals.participant?.id;
		const { seasons, cursor } = await getJoinableGames({
			participantId,
			cursor: typeof req.query.cursor === "string" ? req.query.cursor : undefined,
			take: Math.max(
				Config.MINIMUM_PAGE_SIZE,
				Math.min(Number(req.query.take) || Config.DEFAULT_PAGE_SIZE, Config.MAXIMUM_PAGE_SIZE),
			),
		});
		res.render("pages/secret-dj/browse", { query: req.query, seasons, cursor, participantId, Config });
	})
	.get("/", async (req, res) => {
		if (res.locals.participating) {
			const participantId = res.locals.participant.id;
			const { seasons, cursor } = await getSeasonsForParticipant({
				participantId,
				cursor: typeof req.query.cursor === "string" ? req.query.cursor : undefined,
				take: Math.max(
					Config.MINIMUM_PAGE_SIZE,
					Math.min(Number(req.query.take) || Config.DEFAULT_PAGE_SIZE, Config.MAXIMUM_PAGE_SIZE),
				),
			});
			return res.render("pages/secret-dj/index", { query: req.query, seasons, cursor, participantId, Config });
		} else {
			return res.render("pages/secret-dj/index", {
				query: req.query,
				seasons: [],
				cursor: "",
				participantId: "",
				emailId: res.locals.email?.id,
				Config,
			});
		}
	})
	.get("/archive", async (req, res) => {
		const { seasons, cursor } = await getArchivedSeasons({
			cursor: typeof req.query.cursor === "string" ? req.query.cursor : undefined,
			take: Math.max(
				Config.MINIMUM_PAGE_SIZE,
				Math.min(Number(req.query.take) || Config.DEFAULT_PAGE_SIZE, Config.MAXIMUM_PAGE_SIZE),
			),
		});
		if (res.locals.participating) {
			return res.render("pages/secret-dj/archive", {
				query: req.query,
				seasons,
				cursor,
				participantId: res.locals.participant.id,
				Config,
			});
		} else {
			return res.render("pages/secret-dj/archive", {
				query: req.query,
				seasons,
				cursor,
				participantId: "",
				Config,
			});
		}
	})
	.get("/djs/:id", async (req, res) => {
		try {
			const { entries, entryCursor, name, seasonCursor, seasons } = await getDjEntries({
				participantId: req.params.id,
				entryCursor: typeof req.query.entryCursor === "string" ? req.query.entryCursor : undefined,
				entryTake: Math.max(
					Config.MINIMUM_PAGE_SIZE,
					Math.min(Number(req.query.entryTake) || Config.DEFAULT_PAGE_SIZE, Config.MAXIMUM_PAGE_SIZE),
				),
				seasonCursor: typeof req.query.seasonCursor === "string" ? req.query.seasonCursor : undefined,
				seasonTake: Math.max(
					Config.MINIMUM_PAGE_SIZE,
					Math.min(Number(req.query.seasonTake) || Config.DEFAULT_PAGE_SIZE, Config.MAXIMUM_PAGE_SIZE),
				),
			});
			return res.render("pages/secret-dj/dj", {
				query: req.query,
				name,
				entries,
				entryCursor,
				seasons,
				seasonCursor,
				Config,
			});
		} catch {
			return res.sendStatus(404);
		}
	})
	.get("/games/:seasonId/entries/:entryId", async (req, res) => {
		try {
			const entry = await getEntry(req.params);
			return res.render("pages/secret-dj/entry", {
				entry,
				boxId: entry.box.id,
				host: Config.HOST,
				protocol: req.protocol,
				Config,
			});
		} catch {
			return res.sendStatus(404);
		}
	})
	.get("/games/:id", async (req, res) => {
		try {
			const season = await getSeason(req.params.id);
			if (res.locals.participating) {
				const participantId = res.locals.participant.id;
				const { recipient, dj } = await getParticipantEntriesForSeason({
					seasonId: season.id,
					userId: participantId,
				});
				const { error, success } = getMessagesAndClear(req);
				return res.render("pages/secret-dj/game", {
					error,
					success,
					season,
					participant: res.locals.participant,
					recipient,
					dj,
					boxId: season.box.id,
					host: Config.HOST,
					protocol: req.protocol,
					Config,
				});
			} else {
				const { error, success } = getMessagesAndClear(req);
				return res.render("pages/secret-dj/game", {
					error,
					success,
					season,
					participant: null,
					recipient: null,
					dj: null,
					boxId: season.box.id,
					host: Config.HOST,
					protocol: req.protocol,
					Config,
				});
			}
		} catch {
			return res.sendStatus(404);
		}
	})
	.use(enforceLoggedIn)
	.use(enforceParticipation)
	.post("/games/:id/start", async (req, res) => {
		const seasonId = req.params.id;
		try {
			const ownerId = res.locals.participant.id;
			await startGame({ seasonId, ownerId });
			clearMessagesAndSet({ req, success: "new game started!" });
			return res.redirect(`/secret-dj/games/${seasonId}`);
		} catch {
			clearMessagesAndSet({ req, error: "sorry, that didn't quite work" });
			return res.redirect(`/secret-dj/games/${seasonId}`);
		}
	})
	.post("/games/:id/delete", async (req, res) => {
		const seasonId = req.params.id;
		try {
			const ownerId = res.locals.participant.id;
			await deleteGame({ seasonId, ownerId });
			return res.redirect("/secret-dj");
		} catch {
			clearMessagesAndSet({ req, error: "sorry, that didn't quite work" });
			return res.redirect(`/secret-dj/games/${seasonId}`);
		}
	})
	.post("/games/:id/leave", async (req, res) => {
		try {
			await leaveGame({ seasonId: req.params.id, recipientId: res.locals.participant.id });
			clearMessagesAndSet({ req, success: "you are no longer in this game" });
			return res.redirect(`/secret-dj/games/${req.params.id}`);
		} catch (err) {
			console.log(err);
			clearMessagesAndSet({ req, error: "sorry, that didn't quite work" });
			return res.redirect(`/secret-dj/games/${req.params.id}`);
		}
	})
	.post("/games/:id/edit", async (req, res) => {
		const seasonId = req.params.id;
		try {
			const { name, description } = editSeasonPayloadSchema.parse(req.body);
			const participant: Participant = res.locals.participant;
			await editGame({ name, description, seasonId, ownerId: participant.id });
			clearMessagesAndSet({ req, success: "game data updated!" });
			return res.redirect(`/secret-dj/games/${seasonId}`);
		} catch {
			clearMessagesAndSet({ req, error: "sorry, that didn't quite work" });
			return res.redirect(`/secret-dj/games/${seasonId}`);
		}
	})
	.post("/games/:id/rules", async (req, res) => {
		const seasonId = req.params.id;
		try {
			const { rules } = submitRulesSchema.parse(req.body);
			await setRules({ seasonId, recipientId: res.locals.participant.id, rules });
			clearMessagesAndSet({ req, success: "game rules updated!" });
			return res.redirect(`/secret-dj/games/${seasonId}`);
		} catch {
			clearMessagesAndSet({ req, error: "sorry, that didn't quite work" });
			return res.redirect(`/secret-dj/games/${seasonId}`);
		}
	})
	.post("/games/:id/playlist", async (req, res) => {
		const seasonId = req.params.id;
		try {
			const { link } = submitPlaylistPayloadSchema.parse(req.body);
			await submitPlaylist({
				seasonId,
				playlistUrl: link,
				djId: res.locals.participant.id,
			});
			await endFinishedSeasons();
			clearMessagesAndSet({ req, success: "playlist submitted!" });
			return res.redirect(`/secret-dj/games/${seasonId}`);
		} catch {
			clearMessagesAndSet({ req, error: "sorry, that didn't quite work" });
			return res.redirect(`/secret-dj/games/${seasonId}`);
		}
	})
	.get("/create", (req, res) => res.render("pages/secret-dj/create", { error: "", Config }))
	.post("/create", async (req, res) => {
		try {
			const { name, description, rules: ruleCount } = createSeasonPayloadSchema.parse(req.body);
			const participant: Participant = res.locals.participant;
			const email: Email = res.locals.email;
			const id = await createGame({ name, description, ruleCount, ownerId: participant.id, emailId: email.id });
			clearMessagesAndSet({ req, success: "new game created!" });
			return res.redirect(`games/${id}`);
		} catch (err) {
			console.log(err);
			return res.render("pages/secret-dj/create", { error: "That didn't quite work", Config });
		}
	})
	.get("/settings", (req, res) =>
		res.render("pages/secret-dj/settings", {
			name: res.locals.participant.name,
			error: "",
			success: "",
			Config,
		}),
	)
	.post("/settings", async (req, res) => {
		try {
			const { name } = settingsPayloadSchema.parse(req.body);
			const email: Email = res.locals.email;
			await setParticipant({ emailId: email.id, name });
			return res.render("pages/secret-dj/settings", { name, error: "", success: "saved", Config });
		} catch {
			return res.render("pages/secret-dj/settings", {
				name: res.locals.participant.name,
				error: "that didn't work",
				success: "",
				Config,
			});
		}
	});
