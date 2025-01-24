import { db, transaction } from "../../db";
import { match, P } from "ts-pattern";
import { None, Option, Some } from "../../types/option";
import { HashedString } from "../../types/hashed";
import posters from "./posters";
import { Counter, Action } from "@prisma/client";
import { ACTION_DEFAULTS, Behaviour, EditActionPayload } from "../schema/action";
import { Err, Ok, Result } from "../../types/result";
import { Failure } from "../../types/failure";
import tinycolor from "tinycolor2";

type WhereCounter = Partial<Counter> & { id: string };
type WhereAction = Partial<Action> & { id: string; counter: WhereCounter };

const viewCounter = async (
	counter: Counter,
	poster: { id: number; ip: HashedString },
): Promise<{ firstCounterView: boolean }> => {
	const existingCounterView = await db.counterView.findUnique({
		where: {
			id: {
				counterId: counter.id,
				posterId: poster.id,
			},
		},
	});
	existingCounterView ||
		(await db.counterView.create({
			data: {
				counter: { connect: { id: counter.id } },
				poster: {
					connectOrCreate: {
						where: { ip: poster.ip },
						create: { ip: poster.ip },
					},
				},
			},
		}));
	await db.counter.update({
		where: { id: counter.id, deleted: false },
		data: { views: { increment: 1 } },
		select: { value: true },
	});
	return { firstCounterView: !existingCounterView };
};

const viewAction = async (
	action: Action,
	poster: { id: number; ip: HashedString },
): Promise<{ firstActionView: boolean }> => {
	const existingActionView = await db.actionView.findUnique({
		where: {
			id: {
				actionId: action.id,
				posterId: poster.id,
			},
		},
	});
	existingActionView ||
		(await db.actionView.create({
			data: {
				action: { connect: { id: action.id } },
				poster: {
					connectOrCreate: {
						where: { ip: poster.ip },
						create: { ip: poster.ip },
					},
				},
			},
		}));
	await db.action.update({
		where: {
			id: action.id,
			counter: { id: action.counterId, deleted: false },
		},
		data: {
			views: { increment: 1 },
		},
	});
	return { firstActionView: !existingActionView };
};

const set = async (where: WhereCounter, value: number): Promise<Option<number>> =>
	transaction(async () => {
		const { id } = await db.counter.findUniqueOrThrow({ where: { ...where, deleted: false } });
		const { value: updated } = await db.counter.update({
			where: { id, deleted: false },
			data: { value },
			select: { value: true },
		});
		return Some(updated);
	}).catch(None);

const setDeletion = ({
	id,
	ownerId,
	deleted,
}: {
	id: string;
	ownerId: string;
	deleted: boolean;
}): Promise<Result<void, Failure.FORBIDDEN | Failure.MISSING_DEPENDENCY>> =>
	transaction(async () => {
		const counter = await db.counter.findUnique({ where: { id } });
		if (counter) {
			if (counter.ownerId === ownerId) {
				await db.counter.update({ where: { id, ownerId }, data: { deleted } });
				return Ok();
			} else {
				return Err(Failure.FORBIDDEN);
			}
		} else {
			return Err(Failure.MISSING_DEPENDENCY);
		}
	});

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
				actions: {
					cursor: typeof cursor === "string" ? { id: cursor } : undefined,
					take: count + 1,
					orderBy: {
						sort: "desc",
					},
					include: {
						_count: { select: { viewers: true } },
					},
				},
				_count: { select: { viewers: true } },
			},
		}),
	)
		.with(P.not(P.nullish), (counter) =>
			Some({
				counter: {
					...counter,
					actions: counter.actions.slice(0, count),
				},
				cursor: counter.actions[count]?.id,
			}),
		)
		.otherwise(None);

const get = async (where: WhereCounter): Promise<Option<number>> =>
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

const getCounterAction = async (where: WhereAction): Promise<Option<Action & { counter: Counter }>> =>
	match(
		await db.action.findUnique({
			where: { ...where, counter: { ...where.counter, deleted: false } },
			include: { counter: true },
		}),
	)
		.with(P.not(P.nullish), Some)
		.otherwise(None);

const createCounterAction = async (counterId: string, ownerId: string): Promise<Option<Action>> =>
	db.action
		.create({
			data: {
				...ACTION_DEFAULTS,
				counter: { connect: { id: counterId, ownerId, deleted: false } },
			},
		})
		.then(Some)
		.catch(None);

const getCounterActionDetails = async (env: { counterId: string; actionId: string; ownerId: string }) =>
	db.action
		.findUniqueOrThrow({
			where: {
				id: env.actionId,
				counter: { id: env.counterId, ownerId: env.ownerId, deleted: false },
			},
			include: { counter: true, _count: { select: { viewers: true } } },
		})
		.then((action) =>
			Some({
				...action,
				color: tinycolor({
					r: action.colorR,
					g: action.colorG,
					b: action.colorB,
				}).toString("hex"),
				backgroundColor: tinycolor({
					r: action.backgroundColorR,
					g: action.backgroundColorG,
					b: action.backgroundColorB,
				}).toString("hex"),
			}),
		)
		.catch(None);

const editCounterAction = async (env: {
	actionId: string;
	counterId: string;
	ownerId: string;
	payload: EditActionPayload;
}): Promise<Result<Action, Failure.MISSING_DEPENDENCY | Failure.FORBIDDEN>> => {
	if (await db.action.findUnique({ where: { id: env.actionId, counterId: env.counterId } })) {
		const result = await db.action.update({
			where: {
				id: env.actionId,
				counter: { ownerId: env.ownerId, id: env.counterId, deleted: false },
			},
			data: env.payload,
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

const deleteCounterAction = async (env: {
	actionId: string;
	counterId: string;
	ownerId: string;
}): Promise<Result<void, Failure.MISSING_DEPENDENCY | Failure.FORBIDDEN>> => {
	if (await db.action.findUnique({ where: { id: env.actionId, counterId: env.counterId } })) {
		const result = await db.action.delete({
			where: {
				id: env.actionId,
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

const selectValue = (action: Action) => {
	const behaviour = action.behaviour as Behaviour;
	switch (behaviour) {
		case Behaviour.NOOP:
			return {};
		case Behaviour.INC:
			return { value: { increment: action.amount } };
		case Behaviour.SET:
			return { value: action.amount };
		default:
			throw new Error(`Unrecognized behaviour: ${behaviour satisfies never}`);
	}
};

const actUponCounterAction = async (
	where: WhereAction,
	ip: HashedString,
): Promise<Option<{ action: Action; value: number }>> =>
	transaction(async () =>
		match(await getCounterAction(where))
			.with(Some(P.select()), async (action): Promise<Option<{ action: Action; value: number }>> => {
				const poster = { id: await posters.getId(ip), ip };
				const [{ firstActionView }, { firstCounterView }] = await Promise.all([
					viewAction(action, poster),
					viewCounter(action.counter, poster),
				]);
				const shouldAct = (!action.unique || firstActionView) && (!action.counter.unique || firstCounterView);
				if (shouldAct && action.behaviour !== Behaviour.NOOP) {
					const counter = await db.counter.update({
						where: { id: action.counterId, deleted: false },
						data: selectValue(action),
					});
					return Some({ action, value: counter.value });
				} else {
					return Some({ action, value: action.counter.value });
				}
			})
			.otherwise(None),
	);

const actions = {
	get: getCounterAction,
	create: createCounterAction,
	getDetails: getCounterActionDetails,
	edit: editCounterAction,
	delete: deleteCounterAction,
	act: actUponCounterAction,
};

export default { getDetails, get, set, getOrigin, create, edit, list, setDeletion, actions };
