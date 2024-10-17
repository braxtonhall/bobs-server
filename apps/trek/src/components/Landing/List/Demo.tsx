import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableRow } from "@mui/material";
import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd";
import { DragIndicatorRounded } from "@mui/icons-material";

export const BasicTable = () => {
	let number = 0;
	const row = (name: string, calories: number, fat: number, carbs: number, protein: number) => ({
		id: number++,
		name,
		calories,
		fat,
		carbs,
		protein,
	});

	const [rows, setRows] = useState([
		row("Frozen yoghurt", 159, 6.0, 24, 4.0),
		row("Ice cream sandwich", 237, 9.0, 37, 4.3),
		row("Eclair", 262, 16.0, 24, 6.0),
		row("Cupcake", 305, 3.7, 67, 4.3),
		row("Gingerbread", 356, 16.0, 49, 3.9),
	]);

	return (
		<DragDropContext
			onDragEnd={(result) => {
				if (result.destination) {
					const copy = Array.from(rows);
					const [row] = copy.splice(result.source.index, 1);
					copy.splice(result.destination.index, 0, row);
					setRows(copy);
				}
			}}
		>
			<Table sx={{ minWidth: 650 }} aria-label="simple table">
				<TableHead>
					<TableRow>
						<TableCell>Dessert (100g serving)</TableCell>
						<TableCell align="right">Calories</TableCell>
						<TableCell align="right">Fat&nbsp;(g)</TableCell>
						<TableCell align="right">Carbs&nbsp;(g)</TableCell>
						<TableCell align="right">Protein&nbsp;(g)</TableCell>
					</TableRow>
				</TableHead>
				<Droppable droppableId="episode">
					{(provider) => (
						<TableBody ref={provider.innerRef} {...provider.droppableProps}>
							{rows.map((row, index) => (
								<Draggable key={row.id} draggableId={String(row.id)} index={index}>
									{(provider) => (
										<TableRow
											key={row.id}
											sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
											{...provider.draggableProps}
											ref={provider.innerRef}
										>
											<TableCell component="th" scope="row" {...provider.dragHandleProps}>
												<DragIndicatorRounded />
											</TableCell>
											<TableCell>{row.name}</TableCell>
											<TableCell align="right">{row.calories}</TableCell>
											<TableCell align="right">{row.fat}</TableCell>
											<TableCell align="right">{row.carbs}</TableCell>
											<TableCell align="right">{row.protein}</TableCell>
										</TableRow>
									)}
								</Draggable>
							))}
							{provider.placeholder}
						</TableBody>
					)}
				</Droppable>
			</Table>
		</DragDropContext>
	);
};
