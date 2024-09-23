import { Fragment } from "react";
import { UserSettings, Search, Series, Episode } from "../types";

type Props = {
	episodes: Episode[] | null;
	settings: UserSettings | null;
	search: Search | null;
	setSearch: (search: Search) => void;
	series: Series | null;
};

const List = ({ series }: Props) => {
	// https://mui.com/material-ui/react-table/

	return <Fragment>this is where all the episodes will be listed</Fragment>;
};

export default List;
