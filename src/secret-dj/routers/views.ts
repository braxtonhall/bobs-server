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
			take: Math.max(1, Math.min(Number(req.query.take) || Config.DEFAULT_PAGE_SIZE, Config.MAXIMUM_PAGE_SIZE)),
		});
		res.render("pages/secret-dj/browse", { query: req.query, seasons, cursor, participantId });
	})
	.get("/", async (req, res) => {
		const participantId = res.locals.participant.id;
		const { seasons, cursor } = await getSeasonsForParticipant({
			participantId,
			cursor: typeof req.query.cursor === "string" ? req.query.cursor : undefined,
			take: Math.max(1, Math.min(Number(req.query.take) || Config.DEFAULT_PAGE_SIZE, Config.MAXIMUM_PAGE_SIZE)),
		});
		return res.render("pages/secret-dj/index", { query: req.query, seasons, cursor, participantId });
	})
	.get("/archive", async (req, res) => {
		const participantId = res.locals.participant.id;
		const { seasons, cursor } = await getArchivedSeasons({
			cursor: typeof req.query.cursor === "string" ? req.query.cursor : undefined,
			take: Math.max(1, Math.min(Number(req.query.take) || Config.DEFAULT_PAGE_SIZE, Config.MAXIMUM_PAGE_SIZE)),
		});
		return res.render("pages/secret-dj/archive", { query: req.query, seasons, cursor, participantId });
	})
	.get("/djs/:id", async (req, res) => {
		try {
			const { entries, entryCursor, name, seasonCursor, seasons } = await getDjEntries({
				participantId: req.params.id,
				entryCursor: typeof req.query.entryCursor === "string" ? req.query.entryCursor : undefined,
				entryTake: Math.max(
					1,
					Math.min(Number(req.query.entryTake) || Config.DEFAULT_PAGE_SIZE, Config.MAXIMUM_PAGE_SIZE),
				),
				seasonCursor: typeof req.query.seasonCursor === "string" ? req.query.seasonCursor : undefined,
				seasonTake: Math.max(
					1,
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
			});
		} catch {
			return res.sendStatus(404);
		}
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
				boxId: season.box.id,
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
	.post("/games/:id/leave", async (req, res) => {
		try {
			await leaveGame({ seasonId: req.params.id, recipientId: res.locals.participant.id });
			return res.redirect(
				`/secret-dj/games/${req.params.id}?success=${encodeURIComponent("you are no longer in this game")}`,
			);
		} catch (err) {
			console.log(err);
			return res.redirect(
				`/secret-dj/games/${req.params.id}?error=${encodeURIComponent("that didn't quite work")}`,
			);
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
			return res.redirect(`/secret-dj/games/${seasonId}?error=${encodeURIComponent("that didn't quite work")}`);
		}
	})
	.post("/games/:id/rules", async (req, res) => {
		const seasonId = req.params.id;
		try {
			const { recipientId, rules } = submitRulesSchema.parse(req.body);
			await setRules({ seasonId, recipientId, rules });
			return res.redirect(`/secret-dj/games/${seasonId}?success=${encodeURIComponent("game rules updated!")}`);
		} catch {
			return res.redirect(`/secret-dj/games/${seasonId}?error=${encodeURIComponent("that did not work")}`);
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
			return res.redirect(`/secret-dj/games/${seasonId}?success=${encodeURIComponent("playlist submitted!")}`);
		} catch {
			return res.redirect(`/secret-dj/games/${seasonId}?error=${encodeURIComponent("that did not work")}`);
		}
	})
	.get("/create", (req, res) => res.render("pages/secret-dj/create", { error: "" }))
	.post("/create", async (req, res) => {
		try {
			const { name, description, rules: ruleCount } = createSeasonPayloadSchema.parse(req.body);
			const participant: Participant = res.locals.participant;
			const email: Email = res.locals.email;
			const id = await createGame({ name, description, ruleCount, ownerId: participant.id, emailId: email.id });
			return res.redirect(`games/${id}?success=${encodeURIComponent("new game created!")}`);
		} catch (err) {
			console.log(err);
			return res.render("pages/secret-dj/create", { error: "That didn't quite work" });
		}
	})
	.get("/games/:seasonId/entries/:entryId", async (req, res) => {
		try {
			const entry = await getEntry(req.params);
			return res.render("pages/secret-dj/entry", {
				entry,
				participant: res.locals.participant,
				boxId: entry.box.id,
			});
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
