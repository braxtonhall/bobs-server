import { db } from "../src/db";
import boxes from "../src/toolbox/storage/boxes";
import posters from "../src/toolbox/storage/posters";
import { hashString } from "../src/util";

export const dropTables = async () => {
	await db.permission.deleteMany();
	await db.message.deleteMany();
	await db.counter.deleteMany();
	await db.token.deleteMany();
	await db.post.deleteMany();
	await db.poster.deleteMany();
	await db.entry.deleteMany();
	await db.season.deleteMany();
	await db.box.deleteMany();
	await db.participant.deleteMany();
	await db.email.deleteMany();
};

export function createTestData(address: string): Promise<{ boxId: string; emailId: string }>;
export function createTestData(
	address: string,
	poster: string,
): Promise<{ boxId: string; posterId: number; emailId: string }>;
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
	const boxId = await boxes.create({
		ownerId: email.id,
		name: "bob's box",
		origin: "https://braxtonhall.ca",
	});
	if (poster) {
		const posterId = await posters.getId(hashString(poster));
		return { posterId, boxId, emailId: email.id };
	} else {
		return { boxId, emailId: email.id };
	}
}
