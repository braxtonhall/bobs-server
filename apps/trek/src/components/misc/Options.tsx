import { type MouseEvent, ReactNode, useState } from "react";
import { IconButton, Menu } from "@mui/material";
import { MoreHorizRounded, MoreVertRounded } from "@mui/icons-material";

export const Options = (props: { id: string; children?: ReactNode | ReactNode[]; horizontal?: boolean }) => {
	const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
	const open = Boolean(anchorEl);
	const handleClick = (event: MouseEvent<HTMLButtonElement>) => setAnchorEl(event.currentTarget);
	const handleClose = () => setAnchorEl(null);

	const iconButtonId = `${props.id}-context-button`;
	const menuId = `${props.id}-context-menu`;

	return (
		<>
			<IconButton
				id={iconButtonId}
				aria-controls={open ? menuId : undefined}
				aria-haspopup
				aria-expanded={open}
				size="small"
				onClick={(event) => {
					event.stopPropagation();
					handleClick(event);
				}}
			>
				{props.horizontal ? <MoreHorizRounded /> : <MoreVertRounded />}
			</IconButton>
			<Menu
				id={menuId}
				anchorEl={anchorEl}
				open={open}
				onClose={handleClose}
				MenuListProps={{ "aria-labelledby": iconButtonId }}
				onClick={(event) => event.stopPropagation()}
			>
				{props.children}
			</Menu>
		</>
	);
};
