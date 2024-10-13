import { useState, useMemo } from "react";
import { TextField, Autocomplete } from "@mui/material";
import { api } from "../util/api";

export const Tags = (props: { tags: string[]; setTags: (tags: string[]) => void }) => {
	const [options, setOptions] = useState<string[]>([]);
	const [inputString, setInputString] = useState("");
	// TODO save last used tags and have them set as default values????

	useMemo(() => void api.getViewerTags.query().then(setOptions), []);

	return (
		<Autocomplete
			multiple
			freeSolo
			options={options.filter((tag) => !props.tags.includes(tag))}
			value={props.tags}
			inputValue={inputString}
			onChange={(_, newValue) => props.setTags(newValue)}
			onInputChange={(_, newInputValue) => {
				const tokens = newInputValue.split(",");
				if (tokens.length > 1) {
					props.setTags([
						...props.tags,
						...tokens
							.map((tag) => tag.trim().toLowerCase())
							.filter((tag) => tag && !props.tags.includes(tag)),
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
