import { DependencyList, MutableRefObject, useCallback, useEffect, useState } from "react";

export const useDimensions = (ref: MutableRefObject<HTMLElement | null | undefined>, deps?: DependencyList) => {
	const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
	const onResize = useCallback(
		() =>
			setDimensions({
				width: ref.current?.offsetWidth ?? 0,
				height: ref.current?.offsetHeight ?? 0,
			}),
		[ref],
	);
	useEffect(() => {
		onResize();
		window.addEventListener("resize", onResize);
		return () => window.removeEventListener("resize", onResize);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ref, onResize, ...(deps ?? [])]);
	return dimensions;
};
