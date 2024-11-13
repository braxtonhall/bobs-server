import { db } from "../../db";

export const getSettings = (viewerId: string) =>
	db.viewer
		.findUniqueOrThrow({
			where: { id: viewerId },
			select: {
				colours: true,
				isSpoilerEpisodeReview: true,
				isSpoilerEpisodeDescription: true,
				isSpoilerEpisodePicture: true,
				isSpoilerEpisodeName: true,
				isSpoilerEpisodeReviewSpoilerTag: true,
				isSpoilerEpisodeRating: true,
			},
		})
		.then((settings) => ({ ...settings, colours: JSON.parse(settings.colours) as Record<string, string> }))
		.catch(() => null);
