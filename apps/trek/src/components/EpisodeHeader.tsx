import { DecoratedViewing } from "./Watch/Continue/mergeViewingWithContent";
import { Box } from "@mui/material";
import { useUserContext } from "../contexts/UserContext";

// TODO remove this
const IMG_URL = "https://media.themoviedb.org/t/p/w454_and_h254_bestv2/Asrl6u2tugWf9EJN24uhQ9zvyo6.jpg";
const SERIES_IMG_URL = "/trek/img/TOS.png";

export const EpisodeHeader = ({ episode }: { episode: DecoratedViewing["watchlist"]["episodes"][number] }) => {
	const { settings } = useUserContext();
	const imageUrl = episode.opinions[0] || !settings.isSpoilerEpisodePicture ? IMG_URL : SERIES_IMG_URL;
	return (
		<Box
			sx={{
				padding: 0,
				backgroundImage: `url('${imageUrl}')`,
				backgroundRepeat: "no-repeat",
				backgroundSize: "cover",
				height: "200px",
			}}
		/>
	);
};
