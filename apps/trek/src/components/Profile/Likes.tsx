import { useProfileContext } from "../../contexts/ProfileContext";
import { SpaceFillingBoxContainer } from "../misc/SpaceFillingBox";
import { SwiperTabs } from "../misc/SwiperTabs";
import { TableRowsRounded, ReviewsRounded, VideoLibraryRounded } from "@mui/icons-material";

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
						content: <></>,
					},
					{
						label: "Reviews",
						icon: <ReviewsRounded />,
						content: <></>,
					},
					{
						label: "Watchlists",
						icon: <TableRowsRounded />,
						content: <></>,
					},
				]}
			/>
		</SpaceFillingBoxContainer>
	);
};
