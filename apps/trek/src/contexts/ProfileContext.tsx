import { createContext, ReactNode } from "react";
import { api, API } from "../util/api";
import { useLoaderData } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { useSafeContext } from "../hooks/useSafeContext";

type ProfileContextContent = NonNullable<Awaited<ReturnType<API["getViewer"]["query"]>>> & {
	setSelf: ((opts: Parameters<API["setSelf"]["mutate"]>[0]) => void) | null;
};

export const ProfileContext = createContext<ProfileContextContent | null>(null);

export const useProfileContext = () => useSafeContext(ProfileContext);

export const ProfileContextProvider = ({ children }: { children?: ReactNode | ReactNode[] }) => {
	const { viewer, self } = useLoaderData() as NonNullable<Awaited<ReturnType<API["getViewer"]["query"]>>>;
	const { mutate: setSelf } = useMutation({
		mutationFn: api.setSelf.mutate,
		onMutate: ({ name, about }) => {
			viewer.name = name;
			viewer.about = about;
		},
	});
	return (
		<ProfileContext.Provider value={{ viewer, self, setSelf: self ? setSelf : null }}>
			{children}
		</ProfileContext.Provider>
	);
};
