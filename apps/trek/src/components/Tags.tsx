import { useState, useEffect, useCallback } from "react";
import { TextField, Autocomplete } from "@mui/material";
import { api } from "../util/api";

export const Tags = ({ tags, setTags: outerSetTags }: { tags: string[]; setTags: (tags: string[]) => void }) => {
	const [options, setOptions] = useState<string[]>([]);
	const [inputString, setInputString] = useState("");

	const setTags = useCallback(
		(tags: string[]) => {
			localStorage.setItem("tags", JSON.stringify(tags));
			return outerSetTags(tags);
		},
		[outerSetTags],
	);

	useEffect(() => void api.getViewerTags.query().then(setOptions), []);
	useEffect(() => {
		try {
			const savedTags = JSON.parse(localStorage.getItem("tags") ?? "[]");
			if (Array.isArray(savedTags) && savedTags.every((element) => typeof element === "string")) {
				setTags(savedTags);
			}
		} catch {
			// Do nothing
		}
	}, [setTags]);

	return (
		<Autocomplete
			multiple
			freeSolo
			options={options.filter((tag) => !tags.includes(tag))}
			value={tags}
			inputValue={inputString}
			onChange={(_, newValue) => setTags(newValue)}
			onInputChange={(_, newInputValue) => {
				const tokens = newInputValue.split(",");
				if (tokens.length > 1) {
					setTags([
						...tags,
						...tokens.map((tag) => tag.trim().toLowerCase()).filter((tag) => tag && !tags.includes(tag)),
					]);
					setInputString("");
				} else {
					setInputString(newInputValue);
				}
			}}
			renderInput={(params) => <TextField {...params} label="tags" />}
		/>
	);
};
