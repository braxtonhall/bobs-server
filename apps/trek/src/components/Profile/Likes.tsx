import { useProfileContext } from "../../contexts/ProfileContext";
import { SpaceFillingBoxContainer } from "../misc/SpaceFillingBox";
import { SwiperTabs } from "../misc/SwiperTabs";
import { Container } from "@mui/material";
import { ViewStreamRounded, ReviewsRounded, VideoLibraryRounded } from "@mui/icons-material";

export const Likes = () => {
	const { viewer, self } = useProfileContext();
	// TODO: Watchlists, Reviews, Episodes
	return (
		<SpaceFillingBoxContainer>
			<SwiperTabs
				tabs={[
					{
						label: "Episodes",
						icon: <VideoLibraryRounded />,
						content: <Container maxWidth="md" />,
					},
					{
						label: "Reviews",
						icon: <ReviewsRounded />,
						content: <Container maxWidth="md" />,
					},
					{
						label: "Watchlists",
						icon: <ViewStreamRounded />,
						content: <Container maxWidth="md" />,
					},
				]}
			/>
		</SpaceFillingBoxContainer>
	);
};
