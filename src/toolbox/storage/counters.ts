import { db, transaction } from "../../db";
import { match, P } from "ts-pattern";
import { None, Option, Some } from "../../types/option";
import { HashedString } from "../../types/hashed";
import posters from "./posters";
import { Counter, CounterImage } from "@prisma/client";
import { ImageViewBehaviour } from "../schema/ImageViewBehaviour";
import { Err, Ok, Result } from "../../types/result";
import { Failure } from "../../types/failure";

type Where = Partial<Counter> & { id: string };

const increment = async (where: Where, ip: HashedString): Promise<Option<number>> =>
	transaction(async () => {
		const counter = await db.counter.findUnique({ where: { ...where, deleted: false } });
		if (!counter) {
			return None();
		}
		const posterId = await posters.getId(ip);
		const existingCounterView = await db.counterView.findUnique({
			where: {
				id: {
					counterId: counter.id,
					posterId,
				},
			},
		});
		existingCounterView ||
			(await db.counterView.create({
				data: {
					counter: { connect: counter },
					poster: {
						connectOrCreate: {
							where: { ip },
							create: { ip },
						},
					},
				},
			}));
		const updatedCount = await db.counter.update({
			where: {
				id: counter.id,
				deleted: false,
			},
			data: {
				increments: { increment: 1 },
				...((!counter.unique || (counter.unique && existingCounterView === null)) && {
					value: { increment: counter.incrementAmount },
				}),
			},
			select: { value: true },
		});
		return Some(updatedCount.value);
	});

const set = async (where: Where, value: number): Promise<Option<number>> =>
	transaction(async () => {
		const { id } = await db.counter.findUniqueOrThrow({ where: { ...where, deleted: false } });
		const { value: updated } = await db.counter.update({
			where: { id, deleted: false },
			data: { value },
			select: { value: true },
		});
		return Some(updated);
	}).catch(None);

const getDetails = async (id: string, ownerId: string, count: number, cursor?: string) =>
	match(
		await db.counter.findUnique({
			where: {
				id,
				owner: {
					id: ownerId,
				},
			},
			include: {
				images: {
					cursor: typeof cursor === "string" ? { id: cursor } : undefined,
					take: count + 1,
					orderBy: {
						sort: "desc",
					},
				},
				_count: { select: { views: true } },
			},
		}),
	)
		.with(P.not(P.nullish), (counter) =>
			Some({
				counter: {
					...counter,
					images: counter.images.slice(0, count),
				},
				cursor: counter.images[count]?.id,
			}),
		)
		.otherwise(None);

const get = async (where: Where): Promise<Option<number>> =>
	match(await db.counter.findUnique({ where: { ...where, deleted: false } }))
		.with({ value: P.select() }, Some)
		.otherwise(None);

const getOrigin = async (id: string): Promise<Option<string>> =>
	match(
		await db.counter.findUnique({
			where: {
				id,
			},
			select: {
				origin: true,
			},
		}),
	)
		.with(null, None)
		.otherwise(({ origin }) => (origin ? Some(origin) : None));

const create = async (data: { name: string; origin?: string; ownerId: string; unique: boolean }): Promise<string> =>
	db.counter
		.create({
			data: data,
			select: {
				id: true,
			},
		})
		.then(({ id }) => id);

const edit = async (
	id: string,
	ownerId: string,
	data: {
		name: string;
		origin: string | undefined;
		value: number;
		unique: boolean;
		incrementAmount: number;
		allowApiInc: boolean;
		allowApiSet: boolean;
		allowApiGet: boolean;
	},
): Promise<Result<Counter, Failure.MISSING_DEPENDENCY | Failure.FORBIDDEN>> => {
	if (await db.counter.findUnique({ where: { id, deleted: false, ownerId } })) {
		const result = await db.counter.update({
			where: {
				id,
				ownerId,
			},
			data,
		});
		if (result) {
			return Ok(result);
		} else {
			return Err(Failure.FORBIDDEN);
		}
	} else {
		return Err(Failure.MISSING_DEPENDENCY);
	}
};

const list = async (ownerId: string, deleted: boolean, count: number, cursor?: string) => {
	const counters = await db.counter.findMany({
		where: {
			deleted,
			ownerId,
		},
		select: {
			id: true,
			name: true,
			value: true,
		},
		cursor: typeof cursor === "string" ? { id: cursor } : undefined,
		take: count + 1,
		orderBy: {
			sort: "desc",
		},
	});
	return { counters: counters.slice(0, count), cursor: counters[count]?.id };
};

const getCounterImage = async (counterId: string, imageId: string, ownerId?: string): Promise<Option<CounterImage>> =>
	match(
		await db.counterImage.findUnique({
			where: { id: imageId, counter: { id: counterId, deleted: false, ...(ownerId && { ownerId }) } },
		}),
	)
		.with(P.not(P.nullish), Some)
		.otherwise(None);

const createCounterImage = async (counterId: string, ownerId: string): Promise<Option<CounterImage>> =>
	db.counterImage
		.create({
			data: {
				counter: { connect: { id: counterId, ownerId, deleted: false } },
				viewBehaviour: ImageViewBehaviour.INC,
				amount: 1,
			},
		})
		.then(Some)
		.catch(None);

const getCounterImageDetails = async (env: { counterId: string; imageId: string; ownerId: string }) =>
	db.counterImage
		.findUniqueOrThrow({
			where: {
				id: env.imageId,
				counter: { id: env.counterId, ownerId: env.ownerId, deleted: false },
			},
			include: { counter: true },
		})
		.then(Some)
		.catch(None);

const editCounterImage = async (env: {
	imageId: string;
	counterId: string;
	ownerId: string;
	amount: number;
	behaviour: ImageViewBehaviour;
}): Promise<Result<CounterImage, Failure.MISSING_DEPENDENCY | Failure.FORBIDDEN>> => {
	if (await db.counterImage.findUnique({ where: { id: env.imageId, counterId: env.counterId } })) {
		const result = await db.counterImage.update({
			where: {
				id: env.imageId,
				counter: { ownerId: env.ownerId, id: env.counterId, deleted: false },
			},
			data: { amount: env.amount, viewBehaviour: env.behaviour },
		});
		if (result) {
			return Ok(result);
		} else {
			return Err(Failure.FORBIDDEN);
		}
	} else {
		return Err(Failure.MISSING_DEPENDENCY);
	}
};

const deleteCounterImage = async (env: {
	imageId: string;
	counterId: string;
	ownerId: string;
}): Promise<Result<void, Failure.MISSING_DEPENDENCY | Failure.FORBIDDEN>> => {
	if (await db.counterImage.findUnique({ where: { id: env.imageId, counterId: env.counterId } })) {
		const result = await db.counterImage.delete({
			where: {
				id: env.imageId,
				counter: { ownerId: env.ownerId, id: env.counterId, deleted: false },
			},
		});
		if (result) {
			return Ok();
		} else {
			return Err(Failure.FORBIDDEN);
		}
	} else {
		return Err(Failure.MISSING_DEPENDENCY);
	}
};

const images = {
	get: getCounterImage,
	create: createCounterImage,
	getDetails: getCounterImageDetails,
	edit: editCounterImage,
	delete: deleteCounterImage,
};

export default { increment, getDetails, get, set, getOrigin, create, edit, list, images };
