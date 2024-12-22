import { useCallback, useState } from "react";
import { TextField, Autocomplete } from "@mui/material";

export const Tags = ({
	tags,
	setTags,
	options = [],
}: {
	tags: string[];
	setTags: (callback: string[] | ((tags: string[]) => string[])) => void;
	options?: string[];
}) => {
	const [inputString, setInputString] = useState("");
	const squeezeTags = useCallback((newTokens: string[]) => {
		const tags = newTokens.map((tag) => tag.trim().toLowerCase()).filter((tag) => !!tag);
		return Array.from(new Set(tags));
	}, []);
	return (
		<Autocomplete
			multiple
			freeSolo
			fullWidth
			options={options.filter((tag) => !tags.includes(tag))}
			value={tags}
			inputValue={inputString}
			onChange={(_, newValue) => setTags(squeezeTags(newValue))}
			onInputChange={(_, newInputValue) => {
				const tokens = newInputValue.split(",");
				if (tokens.length > 1) {
					setTags((tags) => squeezeTags([...tags, ...tokens]));
					setInputString("");
				} else {
					setInputString(newInputValue);
				}
			}}
			renderInput={(params) => <TextField {...params} label="Tags" />}
		/>
	);
};
