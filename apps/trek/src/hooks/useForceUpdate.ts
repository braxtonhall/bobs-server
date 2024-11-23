import { useCallback, useState } from "react";

export const useForceUpdate = () => {
	const [, updateState] = useState<unknown>();
	const forceUpdate = useCallback(() => updateState({}), []);
	return { forceUpdate };
};
