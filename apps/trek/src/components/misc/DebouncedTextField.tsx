import { TextField, TextFieldProps, useControlled } from "@mui/material";
import { useMemo } from "react";

function debounce<F extends (...arg: any) => void>(callback: F, waitMs: number) {
	let timeout: ReturnType<typeof setTimeout>;
	return (...args: Parameters<F>) => {
		clearTimeout(timeout);
		timeout = setTimeout(callback, waitMs, ...args);
	};
}

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
