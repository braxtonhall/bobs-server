import { db } from "../../src/storage/db";
import posts from "../../src/storage/posts";
import { createTestData } from "../createTestData";
import * as time from "jest-date-mock";
import { randomUUID } from "crypto";
import { Err, Ok, unsafeUnwrap } from "../../src/types/result";
import { Failure } from "../../src/types/failure";
import Config from "../../src/Config";
import { hashString } from "../../src/util";
import { None, Some } from "../../src/types/option";

describe("posts", () => {
	const posterIp = "foo";
	const ownerEmail = "braxtonjhall@gmail.com";
	let info: { boxId: string; posterId: number };

	beforeAll(async () => {
		await db.post.deleteMany();
		await db.poster.deleteMany();
		await db.box.deleteMany();
		await db.admin.deleteMany();
		info = await createTestData(ownerEmail, posterIp);
	});
	beforeEach(time.clear);
	afterEach(() => db.post.deleteMany());

	describe("creation", () => {
		it("should create a post", async () => {
			const post = await posts.create({
				boxId: info.boxId,
				content: "This is a test",
				from: "Nobody",
				posterId: info.posterId,
			});
			expect(post).toEqual(
				Ok({
					createdAt: expect.any(Date),
					id: expect.any(Number),
					userId: expect.any(String),
					parent: null,
				}),
			);
		});

		it("should fail to create a post if the box does not exist", async () => {
			const post = await posts.create({
				boxId: randomUUID(),
				content: "This is a test",
				from: "Nobody",
				posterId: info.posterId,
			});
			expect(post).toEqual(Err(Failure.MISSING_DEPENDENCY));
		});

		it("should fail to create a post if the parent does not exist", async () => {
			const post = await posts.create({
				boxId: info.boxId,
				content: "This is a test",
				from: "Nobody",
				posterId: info.posterId,
				parentId: 10,
			});
			expect(post).toEqual(Err(Failure.MISSING_DEPENDENCY));
		});
	});

	describe("reading", () => {
		it("should be able to get the internal id from a user id", async () => {
			const post = unsafeUnwrap(
				await posts.create({
					boxId: info.boxId,
					content: "This is a test",
					from: "Nobody",
					posterId: info.posterId,
				}),
			);
			expect(await posts.getId(post.userId, info.boxId)).toEqual(Some(post.id));
		});

		it("should fail to get an internal id if the box id is incorrect", async () => {
			const post = unsafeUnwrap(
				await posts.create({
					boxId: info.boxId,
					content: "This is a test",
					from: "Nobody",
					posterId: info.posterId,
				}),
			);
			expect(await posts.getId(post.userId, randomUUID())).toEqual(None);
		});

		it("should fail to get an internal id from a user id that does not exist", async () =>
			expect(await posts.getId(randomUUID(), randomUUID())).toEqual(None));

		it("should list a post", async () => {
			const post = unsafeUnwrap(
				await posts.create({
					boxId: info.boxId,
					content: "This is a test",
					from: "Nobody",
					posterId: info.posterId,
				}),
			);
			const list = await posts.list({
				boxId: info.boxId,
				showDead: false,
				count: 3,
				ip: hashString(posterIp),
			});
			expect(list).toEqual(
				Ok([
					{
						content: "This is a test",
						from: "Nobody",
						id: post.id,
						parent: post.parent,
						userId: post.userId,
						createdAt: post.createdAt,
						poster: { ip: hashString(posterIp) },
						_count: { children: 0 },
					},
				]),
			);
		});

		it("should list entries in order", async () => {
			const expected = [];
			for (let i = 0; i < 1000; i++) {
				const content = randomUUID();
				const from = randomUUID();
				const post = unsafeUnwrap(
					await posts.create({
						boxId: info.boxId,
						content,
						from,
						posterId: info.posterId,
					}),
				);
				expected.push({
					content,
					from,
					id: post.id,
					userId: post.userId,
					createdAt: post.createdAt,
					parent: post.parent,
					poster: { ip: hashString(posterIp) },
					_count: { children: 0 },
				});
			}
			expect(
				await posts.list({
					boxId: info.boxId,
					showDead: false,
					count: 1000,
					ip: hashString(posterIp),
				}),
			).toEqual(Ok(expected.reverse()));
		});

		it("should list with children", async () => {
			const parent = unsafeUnwrap(
				await posts.create({
					boxId: info.boxId,
					content: "This is a parent",
					from: "Nobody",
					posterId: info.posterId,
				}),
			);
			const child = unsafeUnwrap(
				await posts.create({
					boxId: info.boxId,
					content: "This is a child",
					from: "Nobody",
					posterId: info.posterId,
					parentId: parent.id,
				}),
			);
			const list = unsafeUnwrap(
				await posts.list({
					boxId: info.boxId,
					showDead: false,
					count: 3,
					ip: hashString(posterIp),
				}),
			);
			expect(list).toEqual([
				{
					content: "This is a child",
					from: "Nobody",
					id: child.id,
					parent: {
						userId: parent.userId,
					},
					userId: child.userId,
					createdAt: child.createdAt,
					poster: { ip: hashString(posterIp) },
					_count: { children: 0 },
				},
				{
					content: "This is a parent",
					from: "Nobody",
					id: parent.id,
					parent: null,
					userId: parent.userId,
					createdAt: parent.createdAt,
					poster: { ip: hashString(posterIp) },
					_count: { children: 1 },
				},
			]);
		});

		it("should list dead posts with showDead on", async () => {
			const aliveA = unsafeUnwrap(
				await posts.create({
					boxId: info.boxId,
					content: "This is first alive",
					from: "Nobody",
					posterId: info.posterId,
				}),
			);
			const dead = unsafeUnwrap(
				await posts.create({
					boxId: info.boxId,
					content: "This is dead",
					from: "Nobody",
					posterId: info.posterId,
				}),
			);
			const aliveB = unsafeUnwrap(
				await posts.create({
					boxId: info.boxId,
					content: "This is second alive",
					from: "Nobody",
					posterId: info.posterId,
				}),
			);
			const poster = await posts.setDeadAndGetPosterId(dead.userId, ownerEmail, true);
			expect(poster).toEqual(Ok(info.posterId));
			const list = unsafeUnwrap(
				await posts.list({
					boxId: info.boxId,
					showDead: true,
					count: 3,
					ip: hashString(randomUUID()),
				}),
			);
			expect(list).toEqual([
				{
					content: "This is second alive",
					from: "Nobody",
					id: aliveB.id,
					parent: null,
					userId: aliveB.userId,
					createdAt: aliveB.createdAt,
					poster: { ip: hashString(posterIp) },
					_count: { children: 0 },
				},
				{
					content: "This is dead",
					from: "Nobody",
					id: dead.id,
					parent: null,
					userId: dead.userId,
					createdAt: dead.createdAt,
					poster: { ip: hashString(posterIp) },
					_count: { children: 0 },
				},
				{
					content: "This is first alive",
					from: "Nobody",
					id: aliveA.id,
					parent: null,
					userId: aliveA.userId,
					createdAt: aliveA.createdAt,
					poster: { ip: hashString(posterIp) },
					_count: { children: 0 },
				},
			]);
		});

		it("should not list dead posts with showDead off", async () => {
			const aliveA = unsafeUnwrap(
				await posts.create({
					boxId: info.boxId,
					content: "This is first alive",
					from: "Nobody",
					posterId: info.posterId,
				}),
			);
			const dead = unsafeUnwrap(
				await posts.create({
					boxId: info.boxId,
					content: "This is dead",
					from: "Nobody",
					posterId: info.posterId,
				}),
			);
			const aliveB = unsafeUnwrap(
				await posts.create({
					boxId: info.boxId,
					content: "This is second alive",
					from: "Nobody",
					posterId: info.posterId,
				}),
			);
			const poster = await posts.setDeadAndGetPosterId(dead.userId, ownerEmail, true);
			expect(poster).toEqual(Ok(info.posterId));
			const list = unsafeUnwrap(
				await posts.list({
					boxId: info.boxId,
					showDead: false,
					count: 3,
					ip: hashString(randomUUID()),
				}),
			);
			expect(list).toEqual([
				{
					content: "This is second alive",
					from: "Nobody",
					id: aliveB.id,
					parent: null,
					userId: aliveB.userId,
					createdAt: aliveB.createdAt,
					poster: { ip: hashString(posterIp) },
					_count: { children: 0 },
				},
				{
					content: "This is first alive",
					from: "Nobody",
					id: aliveA.id,
					parent: null,
					userId: aliveA.userId,
					createdAt: aliveA.createdAt,
					poster: { ip: hashString(posterIp) },
					_count: { children: 0 },
				},
			]);
		});

		it("should list dead posts if they are from this requestor", async () => {
			const aliveA = unsafeUnwrap(
				await posts.create({
					boxId: info.boxId,
					content: "This is first alive",
					from: "Nobody",
					posterId: info.posterId,
				}),
			);
			const dead = unsafeUnwrap(
				await posts.create({
					boxId: info.boxId,
					content: "This is dead",
					from: "Nobody",
					posterId: info.posterId,
				}),
			);
			const aliveB = unsafeUnwrap(
				await posts.create({
					boxId: info.boxId,
					content: "This is second alive",
					from: "Nobody",
					posterId: info.posterId,
				}),
			);
			const poster = await posts.setDeadAndGetPosterId(dead.userId, ownerEmail, true);
			expect(poster).toEqual(Ok(info.posterId));
			const list = unsafeUnwrap(
				await posts.list({
					boxId: info.boxId,
					showDead: false,
					count: 3,
					ip: hashString(posterIp),
				}),
			);
			expect(list).toEqual([
				{
					content: "This is second alive",
					from: "Nobody",
					id: aliveB.id,
					parent: null,
					userId: aliveB.userId,
					createdAt: aliveB.createdAt,
					poster: { ip: hashString(posterIp) },
					_count: { children: 0 },
				},
				{
					content: "This is dead",
					from: "Nobody",
					id: dead.id,
					parent: null,
					userId: dead.userId,
					createdAt: dead.createdAt,
					poster: { ip: hashString(posterIp) },
					_count: { children: 0 },
				},
				{
					content: "This is first alive",
					from: "Nobody",
					id: aliveA.id,
					parent: null,
					userId: aliveA.userId,
					createdAt: aliveA.createdAt,
					poster: { ip: hashString(posterIp) },
					_count: { children: 0 },
				},
			]);
		});

		it("should list from cursor if provided", async () => {
			const A = unsafeUnwrap(
				await posts.create({
					boxId: info.boxId,
					content: "This is A",
					from: "Nobody",
					posterId: info.posterId,
				}),
			);
			const B = unsafeUnwrap(
				await posts.create({
					boxId: info.boxId,
					content: "This is B",
					from: "Nobody",
					posterId: info.posterId,
				}),
			);
			const C = unsafeUnwrap(
				await posts.create({
					boxId: info.boxId,
					content: "This is C",
					from: "Nobody",
					posterId: info.posterId,
				}),
			);
			const expected = [
				{
					content: "This is C",
					from: "Nobody",
					id: C.id,
					parent: null,
					userId: C.userId,
					createdAt: C.createdAt,
					poster: { ip: hashString(posterIp) },
					_count: { children: 0 },
				},
				{
					content: "This is B",
					from: "Nobody",
					id: B.id,
					parent: null,
					userId: B.userId,
					createdAt: B.createdAt,
					poster: { ip: hashString(posterIp) },
					_count: { children: 0 },
				},
				{
					content: "This is A",
					from: "Nobody",
					id: A.id,
					parent: null,
					userId: A.userId,
					createdAt: A.createdAt,
					poster: { ip: hashString(posterIp) },
					_count: { children: 0 },
				},
			];
			expect(
				await posts.list({
					boxId: info.boxId,
					showDead: false,
					count: 3,
					ip: hashString(posterIp),
				}),
			).toEqual(Ok(expected));

			expect(
				await posts.list({
					boxId: info.boxId,
					showDead: false,
					count: 3,
					ip: hashString(posterIp),
					cursor: C.userId,
				}),
			).toEqual(Ok(expected));

			expect(
				await posts.list({
					boxId: info.boxId,
					showDead: false,
					count: 3,
					ip: hashString(posterIp),
					cursor: B.userId,
				}),
			).toEqual(Ok(expected.slice(1)));

			expect(
				await posts.list({
					boxId: info.boxId,
					showDead: false,
					count: 3,
					ip: hashString(posterIp),
					cursor: A.userId,
				}),
			).toEqual(Ok(expected.slice(2)));
		});
	});

	describe("updating", () => {
		it("should be able to set a post to dead", async () => {
			const post = unsafeUnwrap(
				await posts.create({
					boxId: info.boxId,
					content: "This is a test",
					from: "Nobody",
					posterId: info.posterId,
				}),
			);
			expect(
				await posts.list({
					boxId: info.boxId,
					showDead: false,
					count: 3,
					ip: hashString(randomUUID()),
				}),
			).toEqual(
				Ok([
					{
						content: "This is a test",
						from: "Nobody",
						id: post.id,
						parent: null,
						userId: post.userId,
						createdAt: post.createdAt,
						poster: { ip: hashString(posterIp) },
						_count: { children: 0 },
					},
				]),
			);
			const poster = await posts.setDeadAndGetPosterId(post.userId, ownerEmail, true);
			expect(poster).toEqual(Ok(info.posterId));
			expect(
				await posts.list({
					boxId: info.boxId,
					showDead: false,
					count: 3,
					ip: hashString(randomUUID()),
				}),
			).toEqual(Ok([]));
		});

		it("should do nothing if you repeatedly set a post to dead", async () => {
			const post = unsafeUnwrap(
				await posts.create({
					boxId: info.boxId,
					content: "This is a test",
					from: "Nobody",
					posterId: info.posterId,
				}),
			);
			expect(
				await posts.list({
					boxId: info.boxId,
					showDead: false,
					count: 3,
					ip: hashString(randomUUID()),
				}),
			).toEqual(
				Ok([
					{
						content: "This is a test",
						from: "Nobody",
						id: post.id,
						parent: null,
						userId: post.userId,
						createdAt: post.createdAt,
						poster: { ip: hashString(posterIp) },
						_count: { children: 0 },
					},
				]),
			);
			const before = await posts.setDeadAndGetPosterId(post.userId, ownerEmail, true);
			const poster = await posts.setDeadAndGetPosterId(post.userId, ownerEmail, true);
			expect(before).toEqual(Ok(info.posterId));
			expect(poster).toEqual(Ok(info.posterId));
			expect(
				await posts.list({
					boxId: info.boxId,
					showDead: false,
					count: 3,
					ip: hashString(randomUUID()),
				}),
			).toEqual(Ok([]));
		});

		it("should be able to set a post to undead", async () => {
			const post = unsafeUnwrap(
				await posts.create({
					boxId: info.boxId,
					content: "This is a test",
					from: "Nobody",
					posterId: info.posterId,
				}),
			);
			await posts.setDeadAndGetPosterId(post.userId, ownerEmail, true);
			const poster = await posts.setDeadAndGetPosterId(post.userId, ownerEmail, false);
			expect(poster).toEqual(Ok(info.posterId));
			expect(
				await posts.list({
					boxId: info.boxId,
					showDead: false,
					count: 3,
					ip: hashString(randomUUID()),
				}),
			).toEqual(
				Ok([
					{
						content: "This is a test",
						from: "Nobody",
						id: post.id,
						parent: null,
						userId: post.userId,
						createdAt: post.createdAt,
						poster: { ip: hashString(posterIp) },
						_count: { children: 0 },
					},
				]),
			);
		});

		it("should do nothing if you repeatedly set a post to undead", async () => {
			const post = unsafeUnwrap(
				await posts.create({
					boxId: info.boxId,
					content: "This is a test",
					from: "Nobody",
					posterId: info.posterId,
				}),
			);
			const before = await posts.setDeadAndGetPosterId(post.userId, ownerEmail, false);
			expect(before).toEqual(Ok(info.posterId));
			await posts.setDeadAndGetPosterId(post.userId, ownerEmail, true);
			const poster = await posts.setDeadAndGetPosterId(post.userId, ownerEmail, false);
			expect(poster).toEqual(Ok(info.posterId));
			expect(
				await posts.list({
					boxId: info.boxId,
					showDead: false,
					count: 3,
					ip: hashString(randomUUID()),
				}),
			).toEqual(
				Ok([
					{
						content: "This is a test",
						from: "Nobody",
						id: post.id,
						parent: null,
						userId: post.userId,
						createdAt: post.createdAt,
						poster: { ip: hashString(posterIp) },
						_count: { children: 0 },
					},
				]),
			);
			const after = await posts.setDeadAndGetPosterId(post.userId, ownerEmail, false);
			expect(after).toEqual(Ok(info.posterId));
		});

		it("should fail to set a post to dead if the id does not exist", async () =>
			expect(await posts.setDeadAndGetPosterId(randomUUID(), ownerEmail, true)).toEqual(
				Err(Failure.MISSING_DEPENDENCY),
			));

		it("should fail to set a post to undead if the id does not exist", async () =>
			expect(await posts.setDeadAndGetPosterId(randomUUID(), ownerEmail, false)).toEqual(
				Err(Failure.MISSING_DEPENDENCY),
			));

		it("should fail to set a post dead if you use the wrong owner email", async () => {
			const post = unsafeUnwrap(
				await posts.create({
					boxId: info.boxId,
					content: "This is a test",
					from: "Nobody",
					posterId: info.posterId,
				}),
			);
			expect(await posts.setDeadAndGetPosterId(post.userId, randomUUID(), true)).toEqual(
				Err(Failure.UNAUTHORIZED),
			);
		});

		it("should fail to set a post undead if you use the wrong owner email", async () => {
			const post = unsafeUnwrap(
				await posts.create({
					boxId: info.boxId,
					content: "This is a test",
					from: "Nobody",
					posterId: info.posterId,
				}),
			);
			expect(await posts.setDeadAndGetPosterId(post.userId, randomUUID(), false)).toEqual(
				Err(Failure.UNAUTHORIZED),
			);
		});
	});

	describe("deletion", () => {
		it("should delete a post", async () => {
			const post = unsafeUnwrap(
				await posts.create({
					boxId: info.boxId,
					content: "This is a test",
					from: "Nobody",
					posterId: info.posterId,
				}),
			);
			const result = await posts.delete({
				userId: post.userId,
				boxId: info.boxId,
				posterId: info.posterId,
			});
			expect(result).toEqual(Ok());
		});

		it("should fail to delete a post that does not exist", async () => {
			const result = await posts.delete({
				userId: randomUUID(),
				boxId: info.boxId,
				posterId: info.posterId,
			});
			expect(result).toEqual(Err(Failure.MISSING_DEPENDENCY));
		});

		it("should fail to delete a post that has children", async () => {
			const parent = unsafeUnwrap(
				await posts.create({
					boxId: info.boxId,
					content: "This is a parent",
					from: "Nobody",
					posterId: info.posterId,
				}),
			);
			await posts.create({
				boxId: info.boxId,
				content: "This is a child",
				from: "Nobody",
				posterId: info.posterId,
				parentId: parent.id,
			});
			const result = await posts.delete({
				userId: parent.userId,
				boxId: info.boxId,
				posterId: info.posterId,
			});
			expect(result).toEqual(Err(Failure.PRECONDITION_FAILED));
		});

		it("should fail to delete a post from a different box", async () => {
			const post = unsafeUnwrap(
				await posts.create({
					boxId: info.boxId,
					content: "This is a parent",
					from: "Nobody",
					posterId: info.posterId,
				}),
			);
			const result = await posts.delete({
				userId: post.userId,
				boxId: randomUUID(),
				posterId: info.posterId,
			});
			expect(result).toEqual(Err(Failure.MISSING_DEPENDENCY));
		});

		it("should fail to delete a post from a different poster", async () => {
			const post = unsafeUnwrap(
				await posts.create({
					boxId: info.boxId,
					content: "This is a parent",
					from: "Nobody",
					posterId: info.posterId,
				}),
			);
			const result = await posts.delete({
				userId: post.userId,
				boxId: info.boxId,
				posterId: info.posterId + 1,
			});
			expect(result).toEqual(Err(Failure.UNAUTHORIZED));
		});

		it("should fail to delete a post that is too old", async () => {
			const post = unsafeUnwrap(
				await posts.create({
					boxId: info.boxId,
					content: "This is a parent",
					from: "Nobody",
					posterId: info.posterId,
				}),
			);
			time.advanceBy(Config.DELETION_TIME_MS + 1);
			const result = await posts.delete({
				userId: post.userId,
				boxId: info.boxId,
				posterId: info.posterId,
			});
			expect(result).toEqual(Err(Failure.PRECONDITION_FAILED));
		});
	});
});
