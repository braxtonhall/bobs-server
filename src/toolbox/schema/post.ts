export type Post = {
	id: string;
	createdAt: Date;
	content: string;
	from: string;
	deletable: boolean;
	parent?: {
		id: string;
		content: string;
	};
};
