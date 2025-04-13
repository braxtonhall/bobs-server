import { Context, useContext } from "react";

export const useSafeContext = <C>(contextConstructor: Context<C>): NonNullable<C> => {
	const context = useContext(contextConstructor);
	if (context === null || context === undefined) {
		throw new Error("Context was not set!");
	} else {
		return context;
	}
};
