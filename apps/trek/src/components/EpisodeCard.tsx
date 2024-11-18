import { Link } from "react-router-dom";
import { Box, BoxProps, Card, CardMedia } from "@mui/material";
import { DecoratedViewing } from "./Watch/Continue/mergeViewingWithContent";

// TODO remove this
const IMG_URL = "https://media.themoviedb.org/t/p/w454_and_h254_bestv2/Asrl6u2tugWf9EJN24uhQ9zvyo6.jpg";

export const EpisodeCard = ({
	episode,
	...props
}: BoxProps & {
	episode: DecoratedViewing["watchlist"]["episodes"][number];
}) => (
	<Box {...props}>
		<Card
			sx={{
				width: "100%",
				height: "100%",
				position: "relative",
			}}
		>
			<Link
				to={`/shows/${episode.seriesId.toLowerCase()}/seasons/${episode.season}/episodes/${episode.production}`}
			>
				<CardMedia
					alt={episode.name}
					image={IMG_URL}
					component="img"
					sx={{
						position: "absolute",
						top: 0,
						right: 0,
						height: "100%",
						width: "100%",
					}}
				/>
			</Link>
		</Card>
	</Box>
);
