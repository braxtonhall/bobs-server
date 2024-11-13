import { createContext } from "react";
import { API } from "../util/api";

export const ProfileContext = createContext({
	viewer: null,
	self: null,
} as unknown as NonNullable<Awaited<ReturnType<API["getViewer"]["query"]>>>);
