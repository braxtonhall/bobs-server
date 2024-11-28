import { db } from "../../db";

export const getSettings = (viewerId: string) =>
	db.viewer
		.findUniqueOrThrow({
			where: { id: viewerId },
			select: {
				colours: true,
				isSpoilerEpisodeReviewComment: true,
				isSpoilerEpisodeReviewScore: true,
				isSpoilerEpisodeDescription: true,
				isSpoilerEpisodePicture: true,
				isSpoilerEpisodeName: true,
				isSpoilerEpisodeReviewCommentSpoilerTag: true,
				isSpoilerEpisodeRating: true,
				gravatar: true,
			},
		})
		.then((settings) => ({ ...settings, colours: JSON.parse(settings.colours) as Record<string, string> }))
		.catch(() => null);
