import { Outlet, useLoaderData } from "react-router-dom";
import { API } from "../../util/api";
import { ProfileContext } from "../../contexts/ProfileContext";

export const ProfileRoot = () => {
	const { viewer, self } = useLoaderData() as NonNullable<Awaited<ReturnType<API["getViewer"]["query"]>>>;
	return (
		<ProfileContext.Provider value={{ viewer, self }}>
			<Outlet />
		</ProfileContext.Provider>
	);
};
