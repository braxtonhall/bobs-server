import { useLoaderData } from "react-router-dom";
import { API } from "../util/api";
import { Box } from "@mui/material";

export const Profile = () => {
	const { viewer, self } = useLoaderData() as NonNullable<Awaited<ReturnType<API["getViewer"]["query"]>>>;
	return <Box>{JSON.stringify({ viewer, self }, null, "\t")}</Box>;
};
