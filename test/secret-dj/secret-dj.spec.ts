import { db } from "../../src/db";
import { createGame } from "../../src/secret-dj/operations/createGame";
import { getActiveGames } from "../../src/secret-dj/operations/getActiveGames";
import { enrolInGame } from "../../src/secret-dj/operations/enrolInGame";
import { updateRules } from "../../src/secret-dj/operations/updateRules";
import { startGame } from "../../src/secret-dj/operations/startGame";
import { getGamesForParticipant } from "../../src/secret-dj/operations/getGamesForParticipant";
import { SeasonState } from "../../src/secret-dj/SeasonState";
import { dropTables } from "../util";
import { createParticipant } from "../../src/secret-dj/operations/createParticipant";

describe("Basic flow", () => {
	let email: Awaited<ReturnType<typeof db.email.create>>;
	let participant: Awaited<ReturnType<typeof db.participant.create>>;
	let gameId: number;
	beforeAll(async () => {
		await dropTables();
		email = await db.email.create({
			data: {
				address: "secretdj@mailer.cool",
			},
		});
		participant = await createParticipant({ emailId: email.id, name: "bob" });
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
		expect(startGame({ ownerId: participant.id, seasonId: 0 })).rejects.toThrow());

	it("should be able to create a game", async () => {
		gameId = await createGame("sdj 2024", 2, participant.id);
		expect(typeof gameId).toEqual("number");
	});

	it("should be in the active games", async () => {
		const games = await getActiveGames();
		expect(games).toEqual([{ name: "sdj 2024", entries: [], id: expect.any(Number) }]);
	});

	it("participant games should include created game", async () =>
		expect(await getGamesForParticipant({ participantId: participant.id })).toEqual({
			recipientEntries: [],
			djEntries: [],
			ownedSeasons: [{ id: expect.any(Number), name: "sdj 2024", state: SeasonState.SIGN_UP, ruleCount: 2 }],
		}));

	it("should not allow you to update rules if you have not signed up yet", () =>
		expect(
			updateRules({ seasonId: gameId, recipientId: participant.id, rules: ["foo", "bar"] }),
		).rejects.toThrow());

	it("should require that a game exists", () =>
		expect(
			enrolInGame({ seasonId: gameId + 1, recipientId: participant.id, rules: ["foo", "bar"] }),
		).rejects.toThrow());

	it("should require that a participant exists", () =>
		expect(
			enrolInGame({ seasonId: gameId, recipientId: participant.id + 1, rules: ["foo", "bar"] }),
		).rejects.toThrow());

	it("should enforce rule count", () =>
		expect(
			enrolInGame({ seasonId: gameId, recipientId: participant.id, rules: ["foo", "bar", "baz"] }),
		).rejects.toThrow());

	it("should be able to sign up for a game", async () => {
		await enrolInGame({ seasonId: gameId, recipientId: participant.id, rules: ["foo", "bar"] });
	});

	it("should now show up in the list of games", async () => {
		const games = await getActiveGames();
		expect(games).toEqual([
			{
				name: "sdj 2024",
				entries: [
					{
						id: expect.any(Number),
						recipient: {
							name: "bob",
						},
						rules: [{ text: "foo" }, { text: "bar" }],
					},
				],
				id: expect.any(Number),
			},
		]);
	});

	it("participant games should include signed up for entry", async () =>
		expect(await getGamesForParticipant({ participantId: participant.id })).toEqual({
			recipientEntries: [
				{
					id: expect.any(Number),
					seasonId: gameId,
					submissionUrl: null,
					rules: [{ text: "foo" }, { text: "bar" }],
				},
			],
			djEntries: [],
			ownedSeasons: [{ id: expect.any(Number), name: "sdj 2024", state: SeasonState.SIGN_UP, ruleCount: 2 }],
		}));

	it("should not allow signing up for the game again", () =>
		expect(
			enrolInGame({ seasonId: gameId, recipientId: participant.id, rules: ["foo", "bar"] }),
		).rejects.toThrow());

	it("should allow one to edit their rules", async () => {
		await updateRules({ seasonId: gameId, recipientId: participant.id, rules: ["baz", "qux"] });
		const games = await getActiveGames();
		expect(games).toEqual([
			{
				name: "sdj 2024",
				entries: [
					{
						id: expect.any(Number),
						recipient: {
							name: "bob",
						},
						rules: [{ text: "baz" }, { text: "qux" }],
					},
				],
				id: expect.any(Number),
			},
		]);
	});

	it("should not be able to start the game if not the correct owner", () =>
		expect(startGame({ ownerId: participant.id + 1, seasonId: gameId })).rejects.toThrow());

	it("should be able to start the game", async () => {
		await startGame({ ownerId: participant.id, seasonId: gameId });
		expect(await getActiveGames()).toEqual([]);
	});

	it("should not be able to start the game again", () =>
		expect(startGame({ ownerId: participant.id, seasonId: gameId })).rejects.toThrow());

	it("should no longer be possible to edit rules", () =>
		expect(
			updateRules({ seasonId: gameId, recipientId: participant.id, rules: ["foo", "bar"] }),
		).rejects.toThrow());

	it("participant games should include signed up for entry", async () =>
		expect(await getGamesForParticipant({ participantId: participant.id })).toEqual({
			recipientEntries: [
				{
					id: expect.any(Number),
					seasonId: gameId,
					submissionUrl: null,
					rules: [{ text: "baz" }, { text: "qux" }],
				},
			],
			djEntries: [
				{
					id: expect.any(Number),
					seasonId: gameId,
					submissionUrl: null,
					rules: [{ text: "baz" }, { text: "qux" }],
				},
			],
			ownedSeasons: [{ id: expect.any(Number), name: "sdj 2024", state: SeasonState.IN_PROGRESS, ruleCount: 2 }],
		}));
});

describe("multiple users flow", () => {});
