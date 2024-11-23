import { styled } from "@mui/material";
import { ComponentProps, JSXElementConstructor } from "react";

export const fadeIn = <C extends JSXElementConstructor<ComponentProps<C>>>(component: C) =>
	styled(component)(() => ({
		animation: "fade-in 300ms",
		"@keyframes fade-in": {
			from: {
				opacity: 0,
			},
			to: {
				opacity: 1,
			},
		},
	}));
