import { db } from "../../db.js";
import { SeasonState } from "../SeasonState.js";

export const getActiveGames = () =>
	db.season.findMany({
		where: { state: SeasonState.SIGN_UP },
		select: {
			entries: {
				select: {
					id: true,
					recipient: { select: { name: true } },
					rules: {
						select: {
							text: true,
						},
					},
				},
			},
			name: true,
			id: true,
			description: true,
		},
	});
