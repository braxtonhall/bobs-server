import counters from "../storage/counters";
import { createCanvas } from "canvas";
import { match, P } from "ts-pattern";
import { None, Option, Some, map, unsafeUnwrap } from "../../types/option";
import Config from "../../Config";
import { HashedString } from "../../types/hashed";
import { transaction } from "../../db";
import { EditActionPayload, MimeType, TextAlign, TextBaseline } from "../schema/action";
import { Action } from "@prisma/client";

const getCounterImage = (
	result: Option<{ image: Pick<Action, keyof EditActionPayload>; value: number }>,
): Option<{ buffer: Buffer; mime: MimeType }> =>
	map(result, ({ image, value }) => {
		const imageWidth = Math.min(image.width, Config.MAX_COUNTER_IMG_WIDTH);
		const imageHeight = Math.min(image.height, Config.MAX_COUNTER_IMG_HEIGHT);

		const imageCanvas = createCanvas(imageWidth, imageHeight);
		const context = imageCanvas.getContext("2d");

		context.fillStyle = `rgba(${image.backgroundColorR},${image.backgroundColorG},${image.backgroundColorB},${image.backgroundColorA / 100})`;
		context.fillRect(0, 0, imageWidth, imageHeight);

		context.fillStyle = `rgba(${image.colorR},${image.colorG},${image.colorB},${image.colorA / 100})`;
		context.font = `$${image.fontStyle} ${image.fontWeight} ${image.fontSize}pt ${image.fontFamily}`; // TODO
		context.textAlign = image.textAlign as TextAlign;
		context.textBaseline = image.textBaseline as TextBaseline;
		context.fillText(String(value), imageWidth / 2, imageHeight / 2);

		const mimeType: "image/png" | "image/jpeg" = `image/${image.mimeType as MimeType}`;
		return { buffer: imageCanvas.toBuffer(mimeType as any), mime: image.mimeType as MimeType };
	});

export const peekCounterImage = (action: EditActionPayload): { buffer: Buffer; mime: MimeType } =>
	unsafeUnwrap(getCounterImage(Some({ value: 12345, image: action })));

export const updateAndGetCounterImage = ({
	counterId,
	actionId,
	ip,
}: {
	counterId: string;
	actionId: string;
	ip: HashedString;
}): Promise<Option<{ buffer: Buffer; mime: MimeType }>> =>
	transaction(async () =>
		match(await counters.actions.act({ id: actionId, counter: { id: counterId } }, ip))
			.with(Some(P.select()), async ({ action, value }) => getCounterImage(Some({ image: action, value })))
			.otherwise(None),
	);
