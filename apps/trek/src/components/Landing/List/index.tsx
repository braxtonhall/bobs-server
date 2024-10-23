// type Props = {
// 	episodes: Episode[] | null;
// 	settings: UserSettings | null;
// 	search: Search | null;
// 	setSearch: (search: Search) => void;
// 	series: Series | null;
// };

import { BasicTable } from "./Demo";

const List = () => {
	// https://mui.com/material-ui/react-table/
	// https://codesandbox.io/p/sandbox/material-ui-table-with-drag-and-drop-rows-515mwz?file=%2Fdemo.js

	return (
		<>
			this is where all the episodes will be listed
			<BasicTable />
		</>
	);
};

export default List;
