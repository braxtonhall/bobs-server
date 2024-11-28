import { Job } from "../../jobs";
import { db } from "../../db";

type FindMany = typeof db.event.findMany;
type FindManyInput = Parameters<FindMany>[0];
type EventWhereInput = NonNullable<(FindManyInput & { where: unknown })["where"]>;
type Keys = Exclude<keyof EventWhereInput, "id" | "time" | "OR" | "AND" | "NOT">;

const cleanUp = async () =>
	db.event.deleteMany({
		where: {
			view: { is: null },
			watchlist: { is: null },
			startedViewing: { is: null },
			finishedViewing: { is: null },
			viewLike: { is: null },
			watchlistLike: { is: null },
			follow: { is: null },
			viewer: { is: null },
		} satisfies { [k in Keys]: { is: null } },
	});

export const deleteBadEvents = {
	callback: cleanUp,
	interval: Infinity,
} satisfies Job;
