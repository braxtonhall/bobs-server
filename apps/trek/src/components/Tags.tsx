import { useState } from "react";
import { TextField, Autocomplete } from "@mui/material";
import { api } from "../util/api";
import { useQuery } from "@tanstack/react-query";

export const Tags = ({ tags, setTags }: { tags: string[]; setTags: (tags: string[]) => void }) => {
	const [inputString, setInputString] = useState("");

	const { data: options = [] } = useQuery({
		queryKey: ["tags"],
		queryFn: () => api.getViewerViewTags.query(),
	});

	return (
		<Autocomplete
			multiple
			freeSolo
			fullWidth
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
			renderInput={(params) => <TextField {...params} label="Tags" />}
		/>
	);
};
