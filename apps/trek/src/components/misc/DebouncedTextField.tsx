import { TextField, TextFieldProps, useControlled } from "@mui/material";
import { useMemo } from "react";
import { debounce } from "../../util/debounce";

type DebouncedTextFieldProps = TextFieldProps & Required<Pick<TextFieldProps, "onChange">>;

export const DebouncedTextField = ({ value: valueProp, onChange, ...rest }: DebouncedTextFieldProps) => {
	const [value, setValue] = useControlled<unknown>({
		name: "DebouncedTextValue",
		state: "value",
		controlled: valueProp,
		default: "",
	});
	const debouncedOnChange = useMemo(() => debounce(onChange, 300), [onChange]);
	return (
		<TextField
			value={value}
			onChange={(newValue) => {
				setValue(newValue.target.value);
				debouncedOnChange(newValue);
			}}
			{...rest}
		/>
	);
};
