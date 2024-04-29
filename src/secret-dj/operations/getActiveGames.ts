import { db } from "../../db";
import { SeasonState } from "../SeasonState";

export const getActiveGames = () =>
	db.season.findMany({
		where: { state: SeasonState.SIGN_UP },
		select: {
			entries: {
				select: {
					id: true,
					rules: {
						select: {
							text: true,
						},
					},
				},
			},
			name: true,
			id: true,
		},
	});
