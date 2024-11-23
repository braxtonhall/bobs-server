import { RefObject, useEffect, useMemo, useState } from "react";

export const useOnScreen = (ref: RefObject<HTMLElement>, onChange?: (isIntersecting: boolean) => void) => {
	const [isIntersecting, setIntersecting] = useState(false);

	const observer = useMemo(
		() =>
			new IntersectionObserver(([entry]) =>
				setIntersecting((isIntersecting) => {
					if (onChange && isIntersecting !== entry.isIntersecting) {
						onChange(entry.isIntersecting);
					}
					return entry.isIntersecting;
				}),
			),
		[onChange],
	);

	useEffect(() => {
		ref.current && observer.observe(ref.current);
		return () => observer.disconnect();
	}, [ref, observer]);

	return isIntersecting;
};
