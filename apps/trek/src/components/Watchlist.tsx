import { useLoaderData } from "react-router-dom";
import { api, API } from "../util/api";
import { Box, Button, Card, CardMedia, Typography } from "@mui/material";
import { VisibilityRounded } from "@mui/icons-material";
import { useEffect, useMemo, useRef, useState } from "react";
import { Episode } from "./Landing/Watch/types";

import "ag-grid-community/styles/ag-grid.css"; // Mandatory CSS required by the Data Grid
import "ag-grid-community/styles/ag-theme-quartz.css"; // Optional Theme applied to the Data Grid
import { AgGridReact } from "ag-grid-react";
import type { GridApi, ColDef, ColumnState } from "ag-grid-community";
// https://trakt.tv/users/yosarasara/lists/star-trek-sara-s-suggested-watch-order?sort=rank,asc
// TODO remove
const IMG_URL = "https://media.themoviedb.org/t/p/w454_and_h254_bestv2/Asrl6u2tugWf9EJN24uhQ9zvyo6.jpg";

const Watchlist = () => {
	const { watchlist, owner } = useLoaderData() as NonNullable<Awaited<ReturnType<API["getWatchlist"]["query"]>>>;
	const [episodes, setEpisodes] = useState<Episode[]>([]);
	const storage = useMemo<{ widths?: Record<string, number>; order: string[] }>(() => {
		try {
			return JSON.parse(localStorage.getItem("columns") ?? "{}");
		} catch {
			return {};
		}
	}, []);
	const definitions = useMemo(
		() =>
			[
				{ field: "sort", hide: true, colId: "sort" },
				{
					colId: "drag",
					rowDrag: true,
					sortable: false,
					width: 102,
					cellRenderer: ({ data: episode }: { data: Episode }) => (
						<Card
							style={{
								width: "40px",
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
				{ field: "name", filter: true, colId: "name" },
				{
					headerName: "Series",
					valueGetter: ({ data }) => data!.abbreviation ?? data!.seriesId,
					filter: true,
					colId: "series",
				},
				{
					headerName: "Season",
					filter: true,
					colId: "season",
					field: "season",
				},
				{
					headerName: "Episode",
					filter: true,
					colId: "episode",
					field: "production",
				},
				{
					headerName: "Stardate",
					filter: true,
					colId: "stardate",
					field: "starDate",
				},
				{
					headerName: "Airdate",
					filter: true,
					colId: "airdate",
					field: "release",
				},
				{
					headerName: "Opinion",
					sortable: false,
					filter: false,
					colId: "opinion",
					// valueGetter: ({ data: episode }) => episode?.opinions[0]?.rating,
					cellRenderer: ({ data: episode }: { data: Episode }) =>
						episode.opinions.length ? (
							<>
								<VisibilityRounded /> {episode._count.views}
							</>
						) : (
							<></>
						),
				},
			] satisfies (ColDef<Episode> & { colId: string })[],
		[],
	);
	const settings = useMemo(() => JSON.parse(watchlist.filters), [watchlist]);
	const columnDefs = useMemo<ColDef<Episode>[]>(() => {
		const state: ColumnState[] = settings.state ?? [];
		const savedColumns = Object.fromEntries(state.map((column) => [column.colId, column]));
		const columnDefinitions = Object.fromEntries(definitions.map((definition) => [definition.colId, definition]));
		const storageColumns = storage.order ?? [];
		return [
			...storageColumns
				.filter((colId) => Object.hasOwn(columnDefinitions, colId))
				.map((colId) => ({
					sort: savedColumns[colId]?.sort,
					sortIndex: savedColumns[colId]?.sortIndex,
					width: storage.widths?.[colId],
					...columnDefinitions[colId],
				})),
			...definitions.filter((column) => !storageColumns.includes(column.colId)),
		];
	}, [settings, definitions, storage]);

	const rowsRef = useRef<Episode[]>([]);
	const selectionRef = useRef<Episode[]>([]);

	const gridRef = useRef<{ api: GridApi<Episode> }>();

	useEffect(
		() =>
			void api.getEpisodes.query().then((episodes) => {
				setEpisodes(episodes);
				const episodeMap = new Map(episodes.map((episode) => [episode.id, episode]));
				const selection = watchlist.episodes.map(({ id }) => episodeMap.get(id)!);
				const selectionMap = new Map(selection.map((episode) => [episode.id, episode]));
				selectionRef.current = selection;
				rowsRef.current = [...selection, ...episodes.filter((episode) => !selectionMap.has(episode.id))];
			}),
		[watchlist],
	);

	const saveSelection = (api: GridApi<Episode>) => {
		const selection: Episode[] = [];
		api.forEachNodeAfterFilterAndSort((node) => {
			if (node.isSelected()) {
				selection.push(node.data!);
			}
		});
		selectionRef.current = selection;
	};

	const saveColumns = (api: GridApi<Episode>) => {
		const columns = api.getColumnState();
		const widths = Object.fromEntries(columns.map((column) => [column.colId, column.width]));
		const order = columns.map((column) => column.colId);
		localStorage.setItem("columns", JSON.stringify({ widths, order }));
	};

	return (
		<>
			<Typography variant="h1">{watchlist.name}</Typography>
			<Typography variant="body1">{watchlist.description}</Typography>

			<Button
				onClick={() => {
					api.updateWatchlist
						.mutate({
							episodes: selectionRef.current.map(({ id }) => id),
							watchlistId: watchlist.id,
							filters: {
								filters: gridRef.current?.api.getFilterModel(),
								state: gridRef.current?.api.getColumnState(),
							},
							name: watchlist.name,
							tags: [],
							description: watchlist.description,
						})
						.then(() => alert("done"))
						.catch(console.error);
				}}
			>
				Save
			</Button>
			<Button
				onClick={() => {
					gridRef.current?.api.setGridOption("rowData", episodes);
					gridRef.current?.api.setGridOption(
						"columnDefs",
						definitions.map((column) => ({ ...column, sort: null, sortIndex: null })),
					);
					gridRef.current?.api.sizeColumnsToFit({
						columnLimits: [
							{
								key: "drag",
								minWidth: 102,
								maxWidth: 102,
							},
							{
								key: "airdate",
								minWidth: 118,
							},
							{
								key: "episode",
								maxWidth: 100,
							},
							{
								key: "season",
								maxWidth: 100,
							},
						],
					});
					rowsRef.current = episodes;
				}}
			>
				Reset Table
			</Button>

			{episodes.length ? (
				<Box className="ag-theme-quartz" style={{ width: "100%", marginBottom: "1em" }}>
					<AgGridReact
						ref={gridRef as any}
						domLayout="autoHeight"
						rowData={rowsRef.current}
						initialState={{
							filter: {
								filterModel: settings.filters,
							},
							rowSelection: selectionRef.current.map(({ id }) => id),
						}}
						columnDefs={columnDefs}
						alwaysMultiSort
						onSortChanged={({ api }) => saveSelection(api)}
						onFilterChanged={({ api }) => saveSelection(api)}
						onSelectionChanged={({ api }) => saveSelection(api)}
						getRowId={(row) => row.data.id}
						onDragStarted={(event) => {
							if (
								event.target.classList.contains("ag-drag-handle") &&
								event.api.getColumnState().some((column) => column.sort)
							) {
								const filterModel = event.api.getFilterModel();
								event.api.setFilterModel(null);
								const rows: Episode[] = [];
								event.api.forEachNodeAfterFilterAndSort((row) => rows.push(row.data!));
								event.api.setGridOption("rowData", rows);
								event.api.setFilterModel(filterModel);
								event.api.applyColumnState({
									state: definitions.map((column) => ({ ...column, sort: null, sortIndex: null })),
								});
								rowsRef.current = rows;
							}
						}}
						onRowDragMove={(event) => {
							const movingNode = event.node;
							const overNode = event.overNode;

							if (movingNode !== overNode) {
								const src = (rowsRef.current as unknown[]).indexOf(movingNode?.data);
								const dst = (rowsRef.current as unknown[]).indexOf(overNode?.data);
								rowsRef.current.splice(src, 1);
								rowsRef.current.splice(dst, 0, movingNode!.data!);
								event.api.setGridOption("rowData", rowsRef.current);
								event.api.clearFocusedCell();
							}
						}}
						onRowDragLeave={(event) => event.api.setGridOption("rowData", rowsRef.current)}
						onRowDragCancel={(event) => event.api.setGridOption("rowData", rowsRef.current)}
						onRowDragEnd={({ api }) => {
							rowsRef.current = api.getGridOption("rowData")!;
							saveSelection(api);
						}}
						onColumnResized={({ api }) => saveColumns(api)}
						onColumnMoved={({ api }) => saveColumns(api)}
						rowSelection={{ mode: "multiRow", selectAll: "filtered" }}
					/>
				</Box>
			) : (
				<>Loading</>
			)}
		</>
	);
};

export default Watchlist;
