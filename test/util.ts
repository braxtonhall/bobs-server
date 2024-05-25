import { db } from "../src/db";
import boxes from "../src/toolbox/storage/boxes";
import posters from "../src/toolbox/storage/posters";
import { hashString } from "../src/util";

export const dropTables = async () => {
	await db.message.deleteMany();
	await db.counter.deleteMany();
	await db.token.deleteMany();
	await db.post.deleteMany();
	await db.poster.deleteMany();
	await db.box.deleteMany();
	await db.admin.deleteMany();
	await db.rule.deleteMany();
	await db.entry.deleteMany();
	await db.season.deleteMany();
	await db.participant.deleteMany();
	await db.email.deleteMany();
};

export function createTestData(address: string): Promise<{ boxId: string }>;
export function createTestData(address: string, poster: string): Promise<{ boxId: string; posterId: number }>;
export async function createTestData(address: string, poster?: string) {
	const email = await db.email.upsert({
		where: {
			address,
		},
		create: {
			address,
			confirmed: true,
		},
		update: {},
	});
	const admin = await db.admin.upsert({
		where: {
			emailId: email.id,
		},
		create: {
			emailId: email.id,
			name: "bob's son",
		},
		update: {},
		select: {
			boxes: true,
			id: true,
		},
	});
	const boxId = await boxes.create({
		ownerId: admin.id,
		name: "bob's box",
		origin: "https://braxtonhall.ca",
	});
	if (poster) {
		const posterId = await posters.getId(hashString(poster));
		return { posterId, boxId };
	} else {
		return { boxId };
	}
}
