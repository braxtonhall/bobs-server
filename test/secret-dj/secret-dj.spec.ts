/**
 * 5. ~~Edit rules (doesn't work once the game has started)~~
 * 6. ~~Start game~~
 * 7. ~~Submit your playlist~~
 * 8. View your old games
 * 9. Get entries for some game
 */

import { db } from "../../src/db";
import { createGame } from "../../src/secret-dj/operations/createGame";
import { getActiveGames } from "../../src/secret-dj/operations/getActiveGames";
import { enrolInGame } from "../../src/secret-dj/operations/enrolInGame";
import { updateRules } from "../../src/secret-dj/operations/updateRules";
import { startGame } from "../../src/secret-dj/operations/startGame";

describe("Basic flow", () => {
	let email: Awaited<ReturnType<typeof db.email.create>>;
	let participant: Awaited<ReturnType<typeof db.participant.create>>;
	let gameId: number;
	beforeAll(async () => {
		await db.rule.deleteMany();
		await db.entry.deleteMany();
		await db.season.deleteMany();
		await db.participant.deleteMany();
		await db.email.deleteMany();

		email = await db.email.create({
			data: {
				address: "secretdj@mailer.cool",
			},
		});
		participant = await db.participant.create({
			data: {
				emailId: email.id,
			},
		});
	});

	it("should not yet be possible to start a game", () => expect(startGame(participant.id, 0)).rejects.toThrow());

	it("should be able to create a game", async () => {
		gameId = await createGame("sdj 2024", 2, participant.id);
		expect(typeof gameId).toEqual("number");
	});

	it("should be in the active games", async () => {
		const games = await getActiveGames();
		expect(games).toEqual([{ name: "sdj 2024", entries: [], id: expect.any(Number) }]);
	});

	it("should not allow you to update rules if you have not signed up yet", () =>
		expect(updateRules(gameId, participant.id, ["foo", "bar"])).rejects.toThrow());

	it("should require that a game exists", () =>
		expect(enrolInGame(gameId + 1, participant.id, ["foo", "bar"])).rejects.toThrow());

	it("should require that a participant exists", () =>
		expect(enrolInGame(gameId, participant.id + 1, ["foo", "bar"])).rejects.toThrow());

	it("should enforce rule count", () =>
		expect(enrolInGame(gameId, participant.id, ["foo", "bar", "baz"])).rejects.toThrow());

	it("should be able to sign up for a game", async () => {
		await enrolInGame(gameId, participant.id, ["foo", "bar"]);
	});

	it("should now show up in the list of games", async () => {
		const games = await getActiveGames();
		expect(games).toEqual([
			{
				name: "sdj 2024",
				entries: [
					{
						id: expect.any(Number),
						// TODO there should be... a name?
						rules: [{ text: "foo" }, { text: "bar" }],
					},
				],
				id: expect.any(Number),
			},
		]);
	});

	it("should not allow signing up for the game again", () =>
		expect(enrolInGame(gameId, participant.id, ["foo", "bar"])).rejects.toThrow());

	it("should allow one to edit their rules", async () => {
		await updateRules(gameId, participant.id, ["baz", "qux"]);
		const games = await getActiveGames();
		expect(games).toEqual([
			{
				name: "sdj 2024",
				entries: [
					{
						id: expect.any(Number),
						// TODO there should be... a name?
						rules: [{ text: "baz" }, { text: "qux" }],
					},
				],
				id: expect.any(Number),
			},
		]);
	});

	it("should not be able to start the game if not the correct owner", () =>
		expect(startGame(participant.id + 1, gameId)).rejects.toThrow());

	it("should be able to start the game", async () => {
		await startGame(participant.id, gameId);
		expect(await getActiveGames()).toEqual([]);
	});

	it("should not be able to start the game again", () => expect(startGame(participant.id, gameId)).rejects.toThrow());

	it("should no longer be possible to edit rules", () =>
		expect(updateRules(gameId, participant.id, ["foo", "bar"])).rejects.toThrow());
});
