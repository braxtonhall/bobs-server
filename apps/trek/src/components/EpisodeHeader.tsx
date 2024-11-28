import { DecoratedViewing } from "./Watch/Continue/mergeViewingWithContent";
import { Box } from "@mui/material";
import { useUserContext } from "../contexts/UserContext";
import { useMemo } from "react";

// TODO remove this
const IMG_URL = "https://media.themoviedb.org/t/p/w454_and_h254_bestv2/Asrl6u2tugWf9EJN24uhQ9zvyo6.jpg";
const SERIES_IMG_URL = "/trek/img/TOS.png";

const getBackgroundImage = (
	isSpoilerEpisodePicture: boolean,
	episode?: DecoratedViewing["watchlist"]["episodes"][number],
) => {
	if (episode) {
		const imageUrl = episode.opinions[0] || !isSpoilerEpisodePicture ? IMG_URL : SERIES_IMG_URL;
		return `url('${imageUrl}')`;
	} else {
		return undefined;
	}
};

export const EpisodeHeader = ({ episode }: { episode?: DecoratedViewing["watchlist"]["episodes"][number] }) => {
	const { settings } = useUserContext();
	const backgroundImage = useMemo(
		() => getBackgroundImage(settings.isSpoilerEpisodePicture, episode),
		[settings, episode],
	);
	return (
		<Box
			sx={{
				padding: 0,
				backgroundImage,
				backgroundRepeat: "no-repeat",
				backgroundSize: "cover",
				height: "200px",
			}}
		/>
	);
};
