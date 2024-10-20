import { Box } from "@mui/material";
import { CSSProperties, ReactNode } from "react";

type DeckProps = {
	children: ReactNode | ReactNode[];
	horizontalPxIncrement?: number;
	verticalPxIncrement?: number;
	stackDirection: "up" | "down";
	style?: CSSProperties;
};

export const Deck = ({
	children,
	verticalPxIncrement = 0,
	horizontalPxIncrement = 0,
	stackDirection,
	style,
}: DeckProps) => {
	const cards = Array.isArray(children) ? children : [children];
	return (
		<Box position="relative" style={style}>
			{cards.map((card, index) => (
				<Box
					key={index}
					style={{
						top: `${index * verticalPxIncrement}px`,
						left: `${index * horizontalPxIncrement}px`,
						position: index === 0 ? "relative" : "absolute",
						zIndex: stackDirection === "up" ? "unset" : cards.length - index,
					}}
				>
					{card}
				</Box>
			))}
		</Box>
	);
};
