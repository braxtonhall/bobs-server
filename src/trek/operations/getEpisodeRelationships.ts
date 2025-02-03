import { db } from "../../db.js";
import { Episode, Opinion } from "@prisma/client";

const include = (viewerId: string) =>
	({
		opinions: { where: { viewerId } },
		_count: { select: { views: { where: { viewerId } } } },
	}) as const;

const addDefaults = <T extends Episode>(episode: T) => ({
	...episode,
	opinions: [] as Opinion[],
	_count: {
		views: 0,
	},
});

export const getEpisodeRelationship = ({
	season,
	seriesId,
	production,
	viewerId,
}: {
	viewerId?: string;
	seriesId: string;
	production: number;
	season: number;
}) => {
	if (viewerId) {
		return db.episode.findFirst({
			where: {
				season,
				seriesId,
				production,
			},
			include: { ...include(viewerId), series: true },
		});
	} else {
		return db.episode
			.findFirst({
				where: {
					season,
					seriesId,
					production,
				},
				include: {
					series: true,
				},
			})
			.then((episode) => episode && addDefaults(episode));
	}
};

export const getEpisodeRelationships = (viewerId?: string) => {
	if (viewerId) {
		return db.episode.findMany({
			include: include(viewerId),
		});
	} else {
		return db.episode.findMany().then((episodes) => episodes.map(addDefaults));
	}
};
