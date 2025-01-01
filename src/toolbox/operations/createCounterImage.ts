import counters from "../storage/counters";
import { createCanvas } from "canvas";
import { match, P } from "ts-pattern";
import { None, Option, Some } from "../../types/option";
import Config from "../../Config";
import { HashedString } from "../../types/hashed";

export const createCounterImage = async (id: string, ip: HashedString): Promise<Option<Buffer>> =>
	match(await counters.updateAndGet(id, ip))
		.with(Some(P.select()), (count) => {
			const imageCanvas = createCanvas(Config.COUNTER_IMG_WIDTH, Config.COUNTER_IMG_HEIGHT);
			const context = imageCanvas.getContext("2d");

			context.fillStyle = "rgba(0,0,0,0)";
			context.fillRect(0, 0, Config.COUNTER_IMG_WIDTH, Config.COUNTER_IMG_HEIGHT);
			context.fillStyle = "#000000";
			context.font = "300 30pt Helvetica Georgia, serif";
			context.textAlign = "center";
			context.textBaseline = "middle";
			context.fillText(String(count), Config.COUNTER_IMG_WIDTH / 2, Config.COUNTER_IMG_HEIGHT / 2);

			return Some(imageCanvas.toBuffer("image/png"));
		})
		.otherwise(None);
