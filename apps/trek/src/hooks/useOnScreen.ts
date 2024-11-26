import { RefObject, useCallback, useEffect, useState } from "react";

const observer = new IntersectionObserver((entries) =>
	entries.map((entry) => void watched.get(entry.target)?.(entry.isIntersecting)),
);

const watched = new Map<Element, (isIntersecting: boolean) => void>();

export const useOnScreen = (ref: RefObject<HTMLElement>, onChange?: (isIntersecting: boolean) => void) => {
	const [isIntersecting, setIntersecting] = useState(false);

	const onWatched = useCallback(
		(newIsIntersecting: boolean) => {
			setIntersecting((isIntersecting) => {
				if (onChange && isIntersecting !== newIsIntersecting) {
					onChange(newIsIntersecting);
				}
				return newIsIntersecting;
			});
		},
		[onChange],
	);

	useEffect(() => {
		if (ref.current) {
			const element = ref.current;
			watched.set(element, onWatched);
			observer.observe(element);
			return () => {
				watched.delete(element);
				observer.unobserve(element);
			};
		}
	}, [ref, onWatched]);

	return isIntersecting;
};
