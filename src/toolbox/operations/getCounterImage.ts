import counters from "../storage/counters";
import { createCanvas } from "canvas";
import { match, P } from "ts-pattern";
import { None, Option, Some, unsafeUnwrap, map } from "../../types/option";
import Config from "../../Config";
import { HashedString } from "../../types/hashed";
import { transaction } from "../../db";
import { ImageViewBehaviour } from "../schema/ImageViewBehaviour";
import { CounterImage } from "@prisma/client";

const actOnView = (image: CounterImage, ip: HashedString) => {
	const behaviour = image.viewBehaviour as ImageViewBehaviour;
	switch (behaviour) {
		case ImageViewBehaviour.INC:
			return counters.increment({ id: image.counterId }, ip);
		case ImageViewBehaviour.SET:
			return counters.set({ id: image.counterId }, image.amount);
		case ImageViewBehaviour.NOOP:
			return counters.get({ id: image.counterId });
		default:
			throw new Error(`Unrecognized behaviour: ${behaviour satisfies never}`);
	}
};

const getUpdatedCount = async (image: CounterImage, ip: HashedString): Promise<number> =>
	unsafeUnwrap(await actOnView(image, ip));

const getCounterImage = (image: Option<{ image: CounterImage; count: number }>): Option<Buffer> =>
	map(image, ({ count }) => {
		const imageCanvas = createCanvas(Config.COUNTER_IMG_WIDTH, Config.COUNTER_IMG_HEIGHT);
		const context = imageCanvas.getContext("2d");

		context.fillStyle = "rgba(0,0,0,0)";
		context.fillRect(0, 0, Config.COUNTER_IMG_WIDTH, Config.COUNTER_IMG_HEIGHT);
		context.fillStyle = "#000000";
		context.font = "300 30pt Helvetica Georgia, serif";
		context.textAlign = "center";
		context.textBaseline = "middle";
		context.fillText(String(count), Config.COUNTER_IMG_WIDTH / 2, Config.COUNTER_IMG_HEIGHT / 2);

		return imageCanvas.toBuffer("image/png");
	});

export const peekCounterImage = (counterId: string, imageId: string, ownerId: string): Promise<Option<Buffer>> =>
	counters.images
		.get(counterId, imageId, ownerId)
		.then((result) => map(result, (image) => ({ image, count: 12345 })))
		.then(getCounterImage);

export const updateAndGetCounterImage = (
	counterId: string,
	imageId: string,
	ip: HashedString,
): Promise<Option<Buffer>> =>
	transaction(async () =>
		match(await counters.images.get(counterId, imageId))
			.with(Some(P.select()), async (image) => {
				const count = await getUpdatedCount(image, ip);
				return getCounterImage(Some({ image, count }));
			})
			.otherwise(None),
	);
