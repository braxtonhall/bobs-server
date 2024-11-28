import { Avatar, AvatarProps } from "@mui/material";

export const Gravatar = ({ hash, children, ...props }: Omit<AvatarProps, "src"> & { hash: string | null }) => (
	<Avatar {...props} src={hash ? `https://www.gravatar.com/avatar/${hash}` : undefined}>
		{children}
	</Avatar>
);
