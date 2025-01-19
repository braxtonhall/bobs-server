import counters from "../storage/counters";
import { createCanvas } from "canvas";
import { match, P } from "ts-pattern";
import { None, Option, Some, unsafeUnwrap } from "../../types/option";
import Config from "../../Config";
import { HashedString } from "../../types/hashed";
import { transaction } from "../../db";
import { ImageViewBehaviour } from "../schema/ImageViewBehaviour";
import { CounterImage } from "@prisma/client";

const actOnView = (image: CounterImage, ip: HashedString) => {
	if (image.viewBehaviour === ImageViewBehaviour.INC) {
		return counters.increment({ id: image.counterId }, ip);
	} else if (image.viewBehaviour === ImageViewBehaviour.SET) {
		return counters.set({ id: image.counterId }, image.amount);
	} else {
		return counters.get({ id: image.counterId });
	}
};

const getUpdatedCount = async (image: CounterImage, ip: HashedString): Promise<number> =>
	unsafeUnwrap(await actOnView(image, ip));

export const getCounterImage = (counterId: string, imageId: string, ip: HashedString): Promise<Option<Buffer>> =>
	transaction(async () =>
		match(await counters.getCounterImage(counterId, imageId))
			.with(Some(P.select()), async (image) => {
				const count = await getUpdatedCount(image, ip);
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
			.otherwise(None),
	);
