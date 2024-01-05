import { db } from "../src/storage/db";
import boxes from "../src/storage/boxes";
import posters from "../src/storage/posters";
import { hashString } from "../src/util";

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
