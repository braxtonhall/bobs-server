import { dropTables } from "../util.js";
import { db, transaction } from "../../src/db.js";
import { Email } from "@prisma/client";

describe("transactions", () => {
	beforeEach(dropTables);

	it("should not drop an operation that occurred outside a transaction", async () => {
		await (async () => {
			await db.email.create({ data: { address: "foo@bar.ca" } });
			throw new Error("SOME ERROR");
		})().catch(() => {});
		expect(await db.email.findUnique({ where: { address: "foo@bar.ca" } })).not.toBeNull();
	});

	it("should drop an operation that occurred inside a transaction", async () => {
		await transaction(async () => {
			await db.email.create({ data: { address: "foo@bar.ca" } });
			throw new Error("SOME ERROR");
		}).catch(() => {});
		expect(await db.email.findUnique({ where: { address: "foo@bar.ca" } })).toBeNull();
	});

	it("should be able to transact within a transaction just fine", async () => {
		await transaction(() =>
			transaction(async () => {
				await db.email.create({ data: { address: "foo@bar.ca" } });
			}),
		);
	});
});

describe("email", () => {
	beforeAll(dropTables);

	it("should be able to create an email", async () => {
		const email = await db.email.create({ data: { address: "foo@bar.ca" } });
		expect(email).toEqual({
			id: expect.any(String),
			subscribed: true,
			address: "foo@bar.ca",
			confirmed: false,
			gravatar: expect.any(String),
		} satisfies Email);
	});

	it("should be able to find the email using a different case", async () => {
		const email = await db.email.findUnique({ where: { address: "Foo@bar.ca" } });
		expect(email).toEqual({
			id: expect.any(String),
			subscribed: true,
			address: "foo@bar.ca",
			confirmed: false,
			gravatar: expect.any(String),
		} satisfies Email);
	});

	it("should disallow creating a new email using a different case", async () =>
		expect(db.email.create({ data: { address: "Foo@bar.ca" } })).rejects.toThrow());

	it("should connect to an existing email if using a different case", async () => {
		const address = "Foo@bar.ca";
		const email = await db.email.upsert({ where: { address }, update: {}, create: { address } });
		expect(email).toEqual({
			id: expect.any(String),
			subscribed: true,
			address: "foo@bar.ca",
			confirmed: false,
			gravatar: expect.any(String),
		} satisfies Email);
	});

	it("should preserve case", async () => {
		const email = await db.email.create({ data: { address: "Bar@Foo.ca" } });
		expect(email).toEqual({
			id: expect.any(String),
			subscribed: true,
			address: "Bar@Foo.ca",
			confirmed: false,
			gravatar: expect.any(String),
		} satisfies Email);
	});
});
