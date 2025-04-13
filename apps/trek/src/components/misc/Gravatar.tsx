import { Avatar, AvatarProps } from "@mui/material";
import { Link } from "react-router-dom";

export const Gravatar = ({
	hash,
	children,
	href,
	...props
}: Omit<AvatarProps, "src"> & { hash: string | null; href?: string }) =>
	href ? (
		<Link to={href}>
			<Avatar {...props} src={hash ? `https://www.gravatar.com/avatar/${hash}` : undefined}>
				{children}
			</Avatar>
		</Link>
	) : (
		<Avatar {...props} src={hash ? `https://www.gravatar.com/avatar/${hash}` : undefined}>
			{children}
		</Avatar>
	);
