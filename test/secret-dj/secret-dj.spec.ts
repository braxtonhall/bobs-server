import { db } from "../../src/db";
import { createGame } from "../../src/secret-dj/operations/createGame";
import { getActiveGames } from "../../src/secret-dj/operations/getActiveGames";
import { setRules } from "../../src/secret-dj/operations/setRules";
import { startGame } from "../../src/secret-dj/operations/startGame";
import { getGamesForParticipant } from "../../src/secret-dj/operations/getGamesForParticipant";
import { SeasonState } from "../../src/secret-dj/SeasonState";
import { dropTables } from "../util";
import { setParticipant } from "../../src/secret-dj/operations/setParticipant";
import { Email, Participant } from "@prisma/client";
import { deleteGame } from "../../src/secret-dj/operations/deleteGame";
import { getSeason } from "../../src/secret-dj/operations/getSeason";
import { submitPlaylist } from "../../src/secret-dj/operations/submitPlaylist";
import { endFinishedSeasons } from "../../src/secret-dj/operations/endFinishedSeasons";

describe("Basic flow", () => {
	let email: Awaited<ReturnType<typeof db.email.create>>;
	let participant: Awaited<ReturnType<typeof db.participant.create>>;
	let gameId: string;
	beforeAll(async () => {
		await dropTables();
		email = await db.email.create({
			data: {
				address: "secretdj@mailer.cool",
			},
		});
		participant = await setParticipant({ emailId: email.id, name: "bob" });
	});

	it("participant games should reject if does not exist", () =>
		expect(getGamesForParticipant({ participantId: participant.id + 1 })).rejects.toThrow());

	it("participant games should begin empty", async () =>
		expect(await getGamesForParticipant({ participantId: participant.id })).toEqual({
			recipientEntries: [],
			djEntries: [],
			ownedSeasons: [],
		}));

	it("should not yet be possible to start a game", () =>
		expect(
			startGame({
				ownerId: participant.id,
				seasonId: "0",
				deadlines: { softDeadline: null, hardDeadline: null },
			}),
		).rejects.toThrow());

	it("should be able to create a game", async () => {
		gameId = await createGame({
			name: "sdj 2024",
			ruleCount: 2,
			ownerId: participant.id,
			description: "foo",
			emailId: email.id,
			unlisted: false,
		});
		expect(gameId).toEqual(expect.any(String));
	});

	it("should be in the active games", async () => {
		const games = await getActiveGames();
		expect(games).toEqual([{ name: "sdj 2024", entries: [], id: expect.any(String), description: "foo" }]);
	});

	it("participant games should include created game", async () =>
		expect(await getGamesForParticipant({ participantId: participant.id })).toEqual({
			recipientEntries: [],
			djEntries: [],
			ownedSeasons: [{ id: expect.any(String), name: "sdj 2024", state: SeasonState.SIGN_UP, ruleCount: 2 }],
		}));

	it("should require that a game exists", () =>
		expect(
			setRules({ seasonId: gameId + 1, recipientId: participant.id, rules: ["foo", "bar"] }),
		).rejects.toThrow());

	it("should require that a participant exists", () =>
		expect(
			setRules({ seasonId: gameId, recipientId: participant.id + 1, rules: ["foo", "bar"] }),
		).rejects.toThrow());

	it("should enforce rule count", () =>
		expect(
			setRules({ seasonId: gameId, recipientId: participant.id, rules: ["foo", "bar", "baz"] }),
		).rejects.toThrow());

	it("should be able to sign up for a game", async () => {
		await setRules({ seasonId: gameId, recipientId: participant.id, rules: ["foo", "bar"] });
	});

	it("should now show up in the list of games", async () => {
		const games = await getActiveGames();
		expect(games).toEqual([
			{
				name: "sdj 2024",
				entries: [
					{
						id: expect.any(String),
						recipient: {
							name: "bob",
						},
						rules: [{ text: "foo" }, { text: "bar" }],
					},
				],
				description: "foo",
				id: expect.any(String),
			},
		]);
	});

	it("participant games should include signed up for entry", async () =>
		expect(await getGamesForParticipant({ participantId: participant.id })).toEqual({
			recipientEntries: [
				{
					id: expect.any(String),
					seasonId: gameId,
					season: {
						state: SeasonState.SIGN_UP,
					},
					submissionUrl: null,
					rules: [{ text: "foo" }, { text: "bar" }],
				},
			],
			djEntries: [],
			ownedSeasons: [{ id: expect.any(String), name: "sdj 2024", state: SeasonState.SIGN_UP, ruleCount: 2 }],
		}));

	it("should allow one to edit their rules", async () => {
		await setRules({ seasonId: gameId, recipientId: participant.id, rules: ["baz", "qux"] });
		const games = await getActiveGames();
		expect(games).toEqual([
			{
				name: "sdj 2024",
				entries: [
					{
						id: expect.any(String),
						recipient: {
							name: "bob",
						},
						rules: [{ text: "baz" }, { text: "qux" }],
					},
				],
				description: "foo",
				id: expect.any(String),
			},
		]);
	});

	it("should not be able to start the game if not the correct owner", () =>
		expect(
			startGame({
				ownerId: participant.id + 1,
				seasonId: gameId,
				deadlines: { softDeadline: null, hardDeadline: null },
			}),
		).rejects.toThrow());

	it("should be able to start the game", async () => {
		await startGame({
			ownerId: participant.id,
			seasonId: gameId,
			deadlines: { softDeadline: null, hardDeadline: null },
		});
		expect(await getActiveGames()).toEqual([]);
	});

	it("should not be able to start the game again", () =>
		expect(
			startGame({
				ownerId: participant.id,
				seasonId: gameId,
				deadlines: { softDeadline: null, hardDeadline: null },
			}),
		).rejects.toThrow());

	it("should no longer be possible to edit rules", () =>
		expect(setRules({ seasonId: gameId, recipientId: participant.id, rules: ["foo", "bar"] })).rejects.toThrow());

	it("participant games should include signed up for entry", async () =>
		expect(await getGamesForParticipant({ participantId: participant.id })).toEqual({
			recipientEntries: [
				{
					id: expect.any(String),
					seasonId: gameId,
					season: {
						state: SeasonState.IN_PROGRESS,
					},
					submissionUrl: null,
					rules: [{ text: "baz" }, { text: "qux" }],
				},
			],
			djEntries: [
				{
					id: expect.any(String),
					seasonId: gameId,
					submissionUrl: null,
					rules: [{ text: "baz" }, { text: "qux" }],
				},
			],
			ownedSeasons: [{ id: expect.any(String), name: "sdj 2024", state: SeasonState.IN_PROGRESS, ruleCount: 2 }],
		}));
});

describe("multiple users flow", () => {
	let ownerParticipant: Participant;
	let participantA: Participant;
	let participantB: Participant;
	let ownerEmail: Email;
	let participantAEmail: Email;
	let participantBEmail: Email;

	let seasonId: string;

	beforeAll(async () => {
		await dropTables();
		[ownerEmail, participantAEmail, participantBEmail] = await Promise.all(
			["owner@secretdj.com", "a@secretdj.com", "b@secretdj.com"].map((email) =>
				db.email.create({ data: { address: email } }),
			),
		);
		ownerParticipant = await setParticipant({ emailId: ownerEmail.id, name: "bob" });
		participantA = await setParticipant({ emailId: participantAEmail.id, name: "milo" });
		participantB = await setParticipant({ emailId: participantBEmail.id, name: "rory" });
	});

	it("owner creates a game", async () => {
		seasonId = await createGame({
			name: "awesomesauce",
			ruleCount: 1,
			ownerId: ownerParticipant.id,
			description: "bar",
			emailId: ownerEmail.id,
			unlisted: false,
		});
		expect(seasonId).toEqual(expect.any(String));
		const gamesForOwner = await getGamesForParticipant({ participantId: ownerParticipant.id });
		expect(gamesForOwner).toEqual({
			ownedSeasons: [
				{
					id: seasonId,
					name: "awesomesauce",
					state: SeasonState.SIGN_UP,
					ruleCount: 1,
				},
			],
			recipientEntries: [],
			djEntries: [],
		});
	});
	it("non-existent participants can't create games", async () =>
		expect(
			createGame({
				name: "awesomesauce",
				ruleCount: 1,
				ownerId: "9999",
				description: "",
				emailId: ownerEmail.id,
				unlisted: false,
			}),
		).rejects.toThrow());
	it("owner can delete game after creating", async () => {
		const mistakenlyCreatedSeasonId = await createGame({
			name: "asdf",
			ruleCount: 9,
			ownerId: ownerParticipant.id,
			description: "baz",
			emailId: ownerEmail.id,
			unlisted: false,
		});
		const gamesForOwnerBeforeDeletion = await getGamesForParticipant({ participantId: ownerParticipant.id });
		expect(gamesForOwnerBeforeDeletion).toEqual({
			ownedSeasons: [
				{
					id: seasonId,
					name: "awesomesauce",
					state: SeasonState.SIGN_UP,
					ruleCount: 1,
				},
				{
					id: mistakenlyCreatedSeasonId,
					name: "asdf",
					state: SeasonState.SIGN_UP,
					ruleCount: 9,
				},
			],
			recipientEntries: [],
			djEntries: [],
		});

		await deleteGame({ seasonId: mistakenlyCreatedSeasonId, ownerId: ownerParticipant.id });

		const gamesForOwnerAfterDeletion = await getGamesForParticipant({ participantId: ownerParticipant.id });
		expect(gamesForOwnerAfterDeletion).toEqual({
			ownedSeasons: [
				{
					id: seasonId,
					name: "awesomesauce",
					state: SeasonState.SIGN_UP,
					ruleCount: 1,
				},
			],
			recipientEntries: [],
			djEntries: [],
		});
	});

	it("new participants sign up for current game", async () => {
		const activeGames = await getActiveGames();
		expect(activeGames.length).toEqual(1);

		await setRules({ seasonId, recipientId: ownerParticipant.id, rules: ["a"] });
		await setRules({ seasonId, recipientId: participantA.id, rules: ["b"] });
		await setRules({ seasonId, recipientId: participantB.id, rules: ["c"] });

		const gamesForOwner = await getGamesForParticipant({ participantId: ownerParticipant.id });
		expect(gamesForOwner).toEqual({
			ownedSeasons: [
				{
					id: seasonId,
					name: "awesomesauce",
					state: SeasonState.SIGN_UP,
					ruleCount: 1,
				},
			],
			recipientEntries: [
				{
					id: expect.any(String),
					seasonId,
					season: {
						state: SeasonState.SIGN_UP,
					},
					submissionUrl: null,
					rules: [{ text: "a" }],
				},
			],
			djEntries: [],
		});

		// non-owner participants should not have ownedSeasons
		const gamesForA = await getGamesForParticipant({ participantId: participantA.id });
		expect(gamesForA).toEqual({
			ownedSeasons: [],
			recipientEntries: [
				{
					id: expect.any(String),
					seasonId,
					season: {
						state: SeasonState.SIGN_UP,
					},
					submissionUrl: null,
					rules: [{ text: "b" }],
				},
			],
			djEntries: [],
		});

		const gamesForB = await getGamesForParticipant({ participantId: participantB.id });
		expect(gamesForB).toEqual({
			ownedSeasons: [],
			recipientEntries: [
				{
					id: expect.any(String),
					seasonId,
					season: {
						state: SeasonState.SIGN_UP,
					},
					submissionUrl: null,
					rules: [{ text: "c" }],
				},
			],
			djEntries: [],
		});
	});
	it("should no longer be able to delete a game", () =>
		expect(deleteGame({ seasonId, ownerId: ownerParticipant.id })).rejects.toThrow());
	it("edited rules must still adhere to rule count", async () =>
		expect(setRules({ seasonId, recipientId: participantA.id, rules: ["a", "b", "c"] })).rejects.toThrow());
	it("participants can edit their rule sets arbitrarily", async () => {
		await setRules({ seasonId, recipientId: participantA.id, rules: ["new updated rule"] });
		const gamesForA = await getGamesForParticipant({ participantId: participantA.id });
		expect(gamesForA).toEqual({
			ownedSeasons: [],
			recipientEntries: [
				{
					id: expect.any(String),
					seasonId,
					season: {
						state: SeasonState.SIGN_UP,
					},
					submissionUrl: null,
					rules: [{ text: "new updated rule" }],
				},
			],
			djEntries: [],
		});
	});

	it("owner starts game, participants matched to one another, no participant left unmatched", async () => {
		await startGame({
			ownerId: ownerParticipant.id,
			seasonId,
			deadlines: { softDeadline: null, hardDeadline: null },
		});

		// no more active games
		const activeGames = await getActiveGames();
		expect(activeGames.length).toEqual(0);

		const djIdToEntryMap: { [key: string]: { entryId: string; recipientId: string } } = {};
		const { entries: allEntries } = await getSeason(seasonId);
		for (const entry of allEntries) {
			djIdToEntryMap[entry.dj!.id] = {
				entryId: entry.id,
				recipientId: entry.recipient.id,
			};
		}

		const allRecipients = new Set(allEntries.map((entry) => entry.recipient.id));
		expect(allRecipients.size).toEqual(3);

		const allDJs = new Set(allEntries.map((entry) => entry.dj!.id));
		expect(allDJs.size).toEqual(3);

		const gamesForOwner = await getGamesForParticipant({ participantId: ownerParticipant.id });
		const gamesForA = await getGamesForParticipant({ participantId: participantA.id });
		const gamesForB = await getGamesForParticipant({ participantId: participantB.id });

		expect(gamesForOwner).toEqual({
			ownedSeasons: [
				{
					id: seasonId,
					name: "awesomesauce",
					state: SeasonState.IN_PROGRESS,
					ruleCount: 1,
				},
			],
			recipientEntries: [
				{
					id: expect.any(String),
					seasonId,
					season: {
						state: SeasonState.IN_PROGRESS,
					},
					submissionUrl: null,
					rules: [{ text: "a" }],
				},
			],
			djEntries: [
				{
					id: djIdToEntryMap[ownerParticipant.id].entryId,
					seasonId,
					submissionUrl: null,
					rules: [{ text: expect.any(String) }],
				},
			],
		});
		expect(gamesForA).toEqual({
			ownedSeasons: [],
			recipientEntries: [
				{
					id: expect.any(String),
					seasonId,
					season: {
						state: SeasonState.IN_PROGRESS,
					},
					submissionUrl: null,
					rules: [{ text: "new updated rule" }],
				},
			],
			djEntries: [
				{
					id: djIdToEntryMap[participantA.id].entryId,
					seasonId,
					submissionUrl: null,
					rules: [{ text: expect.any(String) }],
				},
			],
		});
		expect(gamesForB).toEqual({
			ownedSeasons: [],
			recipientEntries: [
				{
					id: expect.any(String),
					seasonId,
					season: {
						state: SeasonState.IN_PROGRESS,
					},
					submissionUrl: null,
					rules: [{ text: "c" }],
				},
			],
			djEntries: [
				{
					id: djIdToEntryMap[participantB.id].entryId,
					seasonId,
					submissionUrl: null,
					rules: [{ text: expect.any(String) }],
				},
			],
		});
	});
	it("owner can NO LONGER delete game after starting", () =>
		expect(deleteGame({ seasonId, ownerId: ownerParticipant.id })).rejects.toThrow());
	it("participants can submit their playlist submissions", async () => {
		await submitPlaylist({
			seasonId,
			djId: ownerParticipant.id,
			playlistUrl: "https://open.spotify.com/playlist/aaa",
		});
		await submitPlaylist({
			seasonId,
			djId: participantA.id,
			playlistUrl: "https://open.spotify.com/playlist/bbb",
		});
		await submitPlaylist({
			seasonId,
			djId: participantB.id,
			playlistUrl: "https://open.spotify.com/playlist/ccc",
		});
		const { entries: allEntries } = await getSeason(seasonId);
		for (const entry of allEntries) {
			expect(entry).toEqual({
				id: expect.any(String),
				recipient: expect.any(Object),
				dj: expect.any(Object),
				// this is populated in the DB, but won't be displayed to users until the game ends
				submissionUrl: expect.any(String),
				rules: expect.any(Object),
			});
		}
	});
	it("participants can NOT see recipient playlists YET ", async () => {
		const gamesForOwner = await getGamesForParticipant({ participantId: ownerParticipant.id });
		const gamesForA = await getGamesForParticipant({ participantId: participantA.id });
		const gamesForB = await getGamesForParticipant({ participantId: participantB.id });

		expect(gamesForOwner).toEqual({
			ownedSeasons: [
				{
					id: seasonId,
					name: "awesomesauce",
					state: SeasonState.IN_PROGRESS,
					ruleCount: 1,
				},
			],
			recipientEntries: [
				{
					id: expect.any(String),
					seasonId,
					season: {
						state: SeasonState.IN_PROGRESS,
					},
					submissionUrl: null, // receipient URL should remain null
					rules: [{ text: "a" }],
				},
			],
			djEntries: [
				{
					id: expect.any(String),
					seasonId,
					submissionUrl: "https://open.spotify.com/playlist/aaa",
					rules: [{ text: expect.any(String) }],
				},
			],
		});
		expect(gamesForA).toEqual({
			ownedSeasons: [],
			recipientEntries: [
				{
					id: expect.any(String),
					seasonId,
					season: {
						state: SeasonState.IN_PROGRESS,
					},
					submissionUrl: null, // receipient URL should remain null
					rules: [{ text: "new updated rule" }],
				},
			],
			djEntries: [
				{
					id: expect.any(String),
					seasonId,
					submissionUrl: "https://open.spotify.com/playlist/bbb",
					rules: [{ text: expect.any(String) }],
				},
			],
		});
		expect(gamesForB).toEqual({
			ownedSeasons: [],
			recipientEntries: [
				{
					id: expect.any(String),
					seasonId,
					season: {
						state: SeasonState.IN_PROGRESS,
					},
					submissionUrl: null, // receipient URL should remain null
					rules: [{ text: "c" }],
				},
			],
			djEntries: [
				{
					id: expect.any(String),
					seasonId,
					submissionUrl: "https://open.spotify.com/playlist/ccc",
					rules: [{ text: expect.any(String) }],
				},
			],
		});
	});
	it("participants can edit their playlist submissions", async () => {
		await submitPlaylist({
			seasonId,
			djId: ownerParticipant.id,
			playlistUrl: "https://open.spotify.com/playlist/zzz",
		});

		const gamesForOwner = await getGamesForParticipant({ participantId: ownerParticipant.id });
		expect(gamesForOwner).toEqual({
			ownedSeasons: [
				{
					id: seasonId,
					name: "awesomesauce",
					state: SeasonState.IN_PROGRESS,
					ruleCount: 1,
				},
			],
			recipientEntries: [
				{
					id: expect.any(String),
					seasonId,
					season: {
						state: SeasonState.IN_PROGRESS,
					},
					submissionUrl: null, // receipient URL should remain null
					rules: [{ text: "a" }],
				},
			],
			djEntries: [
				{
					id: expect.any(String),
					seasonId,
					submissionUrl: "https://open.spotify.com/playlist/zzz",
					rules: [{ text: expect.any(String) }],
				},
			],
		});
	});

	it("game becomes archived", async () => {
		const finishedSeasons = await endFinishedSeasons();
		expect(finishedSeasons).toEqual(1);
	});
	it("participants can NOW see recipient playlists", async () => {
		const recipientIdToSubmissionUrlMap: { [key: string]: string } = {};
		const { entries: allEntries } = await getSeason(seasonId);
		for (const entry of allEntries) {
			recipientIdToSubmissionUrlMap[entry.recipient.id] = entry.submissionUrl!;
		}

		const gamesForOwner = await getGamesForParticipant({ participantId: ownerParticipant.id });
		const gamesForA = await getGamesForParticipant({ participantId: participantA.id });
		const gamesForB = await getGamesForParticipant({ participantId: participantB.id });

		expect(gamesForOwner).toEqual({
			ownedSeasons: [
				{
					id: seasonId,
					name: "awesomesauce",
					state: SeasonState.ENDED,
					ruleCount: 1,
				},
			],
			recipientEntries: [
				{
					id: expect.any(String),
					seasonId,
					season: {
						state: SeasonState.ENDED,
					},
					submissionUrl: recipientIdToSubmissionUrlMap[ownerParticipant.id], // playlists NOW visible
					rules: [{ text: "a" }],
				},
			],
			djEntries: [
				{
					id: expect.any(String),
					seasonId,
					submissionUrl: "https://open.spotify.com/playlist/zzz",
					rules: [{ text: expect.any(String) }],
				},
			],
		});
		expect(gamesForA).toEqual({
			ownedSeasons: [],
			recipientEntries: [
				{
					id: expect.any(String),
					seasonId,
					season: {
						state: SeasonState.ENDED,
					},
					submissionUrl: recipientIdToSubmissionUrlMap[participantA.id], // playlists NOW visible
					rules: [{ text: "new updated rule" }],
				},
			],
			djEntries: [
				{
					id: expect.any(String),
					seasonId,
					submissionUrl: "https://open.spotify.com/playlist/bbb",
					rules: [{ text: expect.any(String) }],
				},
			],
		});
		expect(gamesForB).toEqual({
			ownedSeasons: [],
			recipientEntries: [
				{
					id: expect.any(String),
					seasonId,
					season: {
						state: SeasonState.ENDED,
					},
					submissionUrl: recipientIdToSubmissionUrlMap[participantB.id], // playlists NOW visible
					rules: [{ text: "c" }],
				},
			],
			djEntries: [
				{
					id: expect.any(String),
					seasonId,
					submissionUrl: "https://open.spotify.com/playlist/ccc",
					rules: [{ text: expect.any(String) }],
				},
			],
		});
	});
	it("participants can no longer edit their playlist submissions", async () => {
		return expect(
			submitPlaylist({ seasonId, djId: participantA.id, playlistUrl: "https://puginarug.com/" }),
		).rejects.toThrow();
	});
	it("owner can still not delete the game", () =>
		expect(deleteGame({ seasonId, ownerId: ownerParticipant.id })).rejects.toThrow());
});
