import { useLoaderData } from "react-router-dom";
import { api, API } from "../util/api";
import { Box, Button, Card, CardMedia, Typography } from "@mui/material";
import { useEffect, useRef, useState } from "react";
import { Episode } from "./Landing/Watch/types";

import "ag-grid-community/styles/ag-grid.css"; // Mandatory CSS required by the Data Grid
import "ag-grid-community/styles/ag-theme-quartz.css"; // Optional Theme applied to the Data Grid
import { AgGridReact } from "ag-grid-react"; // React Data Grid Component

// TODO remove
const IMG_URL = "https://media.themoviedb.org/t/p/w454_and_h254_bestv2/Asrl6u2tugWf9EJN24uhQ9zvyo6.jpg";

function moveInArray(arr: any[], fromIndex: number, toIndex: number) {
	var element = arr[fromIndex];
	arr.splice(fromIndex, 1);
	arr.splice(toIndex, 0, element);
}

const Watchlist = () => {
	const { watchlist, owner } = useLoaderData() as NonNullable<Awaited<ReturnType<API["getWatchlist"]["query"]>>>;
	const [episodes, setEpisodes] = useState<Episode[]>([]);

	const [rows, setRows] = useState<Episode[]>([]);

	// const rowsRef = useRef<Episode[]>([]);
	const selectionRef = useRef<Episode[]>([]);

	useEffect(
		() =>
			void api.getEpisodes.query().then((episodes) => {
				setRows(episodes); // TODO update the sorting and what's in the watchlist or whatever
				setEpisodes(episodes);
			}),
		[watchlist],
	);

	return (
		<>
			<Typography variant="h1">{watchlist.name}</Typography>
			<Typography variant="body1">{watchlist.description}</Typography>

			<Button
				onClick={() => {
					console.log(selectionRef.current);
				}}
			>
				Save
			</Button>
			<Button onClick={() => setRows(episodes)}>Default Sort</Button>

			{rows.length ? (
				<Box className="ag-theme-quartz" style={{ width: "100%", marginBottom: "1em" }}>
					<AgGridReact
						// 	Series	Episode	Name	Stardate	Airdate	Seen	Liked	Liked	Unseen Row	522	Last Seen Row	521	Next Unseen Row	523
						domLayout="autoHeight"
						rowData={rows}
						columnDefs={[
							{
								rowDrag: true,
								sortable: false,
								width: 145,
								cellRenderer: ({ data: episode }: { data: Episode }) => (
									<Card
										style={{
											width: "77px",
											height: "40px",
											marginRight: "0.5em",
											position: "relative",
										}}
									>
										<CardMedia
											alt={episode.name}
											image={IMG_URL}
											component="img"
											sx={{
												position: "absolute",
												top: 0,
												right: 0,
												height: "100%",
												width: "100%",
											}}
										/>
									</Card>
								),
							},
							{ field: "name", filter: true },
							{
								headerName: "Series",
								valueGetter: ({ data }) => data!.abbreviation ?? data!.seriesId,
								filter: true,
							},
						]}
						onSortChanged={(event) => {
							console.log("sort");
							const selection: Episode[] = [];
							event.api.forEachNodeAfterFilterAndSort((node) => {
								if (node.isSelected()) {
									selection.push(node.data!);
								}
							});
							selectionRef.current = selection;
						}}
						onFilterChanged={(event) => {
							console.log("filter");
							const selection: Episode[] = [];
							event.api.forEachNodeAfterFilterAndSort((node) => {
								if (node.isSelected()) {
									selection.push(node.data!);
								}
							});
							selectionRef.current = selection;
						}}
						onSelectionChanged={(event) => {
							console.log("selection");
							const selection: Episode[] = [];
							event.api.forEachNodeAfterFilterAndSort((node) => {
								if (node.isSelected()) {
									selection.push(node.data!);
								}
							});
							selectionRef.current = selection;
						}}
						getRowId={(row) => row.data.id}
						onDragStarted={(event) => {
							if (event.api.getColumnState().some((column) => column.sort)) {
								const filterModel = event.api.getFilterModel();
								event.api.setFilterModel(null);
								const rows: Episode[] = [];
								event.api.forEachNodeAfterFilterAndSort((row) => rows.push(row.data!));
								event.api.setFilterModel(filterModel);
								event.api.resetColumnState();
								setRows(rows);
							}
						}}
						onRowDragMove={(event) => {
							var movingNode = event.node;
							var overNode = event.overNode;

							var rowNeedsToMove = movingNode !== overNode;

							if (rowNeedsToMove) {
								// the list of rows we have is data, not row nodes, so extract the data
								var movingData = movingNode.data!;
								var overData = overNode!.data!;

								var fromIndex = rows.indexOf(movingData);
								var toIndex = rows.indexOf(overData);

								var newStore = rows.slice();
								moveInArray(newStore, fromIndex, toIndex);
								event.api.setGridOption("rowData", newStore);
								event.api.clearFocusedCell();
							}
						}}
						onRowDragLeave={(event) => event.api.setGridOption("rowData", rows)}
						onRowDragCancel={(event) => event.api.setGridOption("rowData", rows)}
						onRowDragEnd={(event) => setRows(event.api.getGridOption("rowData")!)}
						rowSelection={{ mode: "multiRow" }}
					/>
				</Box>
			) : (
				<>Loading</>
			)}
		</>
	);
};

export default Watchlist;
