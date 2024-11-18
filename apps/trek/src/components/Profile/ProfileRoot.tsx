import { Outlet, useLoaderData } from "react-router-dom";
import { api, API } from "../../util/api";
import { ProfileContext } from "../../contexts/ProfileContext";
import { useMutation } from "@tanstack/react-query";

export const ProfileRoot = () => {
	const { viewer, self } = useLoaderData() as NonNullable<Awaited<ReturnType<API["getSelf"]["query"]>>>;
	const { mutate: setSelf } = useMutation({
		mutationFn: api.setSelf.mutate,
		onMutate: ({ name }) => (viewer.name = name),
	});
	return (
		<ProfileContext.Provider value={{ viewer, self, setSelf: self ? setSelf : null }}>
			<Outlet />
		</ProfileContext.Provider>
	);
};
