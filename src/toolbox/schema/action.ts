import tinycolor from "tinycolor2";
import { z } from "zod";
import Config from "../../Config";
import { checkboxSchema } from "../../schema";
import { fontFamilies } from "../canvas/fonts";

export enum Behaviour {
	NOOP = "noop",
	INC = "inc",
	SET = "set",
}

export enum TextAlign {
	LEFT = "left",
	RIGHT = "right",
	CENTRE = "center",
}

export enum TextBaseline {
	ALPHABETIC = "alphabetic",
	TOP = "top",
	HANGING = "hanging",
	MIDDLE = "middle",
	IDEOGRAPHIC = "ideographic",
	BOTTOM = "bottom",
}

export enum FontStyle {
	NORMAL = "normal",
	ITALIC = "italic",
	OBLIQUE = "oblique",
}

export enum MimeType {
	PNG = "png",
	JPG = "jpeg",
}

const hexSchema = z
	.string()
	.toLowerCase()
	.min(4)
	.max(7)
	.regex(/^#[0-9a-f]+$/);

const alphaSchema = z.coerce.number().int().min(0).max(100);

export const editActionSchema = z
	.object({
		color: hexSchema,
		colorA: alphaSchema,
		backgroundColor: hexSchema,
		backgroundColorA: alphaSchema,
		behaviour: z.nativeEnum(Behaviour),
		amount: z.coerce.number().int(),
		width: z.coerce.number().int().min(0).max(Config.MAX_COUNTER_IMG_WIDTH),
		height: z.coerce.number().int().min(0).max(Config.MAX_COUNTER_IMG_HEIGHT),
		textAlign: z.nativeEnum(TextAlign),
		textBaseline: z.nativeEnum(TextBaseline),
		fontFamily: z.enum(fontFamilies),
		fontSize: z.coerce.number().int().min(0),
		fontStyle: z.nativeEnum(FontStyle),
		fontWeight: z.coerce.number().int().multipleOf(100).min(100).max(900),
		mimeType: z.nativeEnum(MimeType),
		unique: checkboxSchema,
		textX: z.coerce.number().int().min(0).max(Config.MAX_COUNTER_IMG_WIDTH),
		textY: z.coerce.number().int().min(0).max(Config.MAX_COUNTER_IMG_HEIGHT),
	})
	.transform(({ color, backgroundColor, ...action }) => {
		const { r: colorR, g: colorG, b: colorB } = tinycolor(color).toRgb();
		const { r: backgroundColorR, g: backgroundColorG, b: backgroundColorB } = tinycolor(backgroundColor).toRgb();
		return {
			...action,
			colorR,
			colorB,
			colorG,
			backgroundColorR,
			backgroundColorB,
			backgroundColorG,
		};
	});

export type EditActionPayload = z.output<typeof editActionSchema>;

export const ACTION_DEFAULTS: EditActionPayload = {
	behaviour: Behaviour.INC,
	amount: 1,
	colorR: 0,
	colorG: 0,
	colorB: 0,
	colorA: 100,
	backgroundColorR: 255,
	backgroundColorG: 255,
	backgroundColorB: 255,
	backgroundColorA: 100,
	width: Config.DEFAULT_COUNTER_IMG_WIDTH,
	height: Config.DEFAULT_COUNTER_IMG_HEIGHT,
	textAlign: TextAlign.CENTRE,
	textBaseline: TextBaseline.MIDDLE,
	fontFamily: fontFamilies[0],
	fontSize: 12,
	fontStyle: FontStyle.NORMAL,
	fontWeight: 400,
	mimeType: MimeType.PNG,
	unique: false,
	textX: Config.DEFAULT_COUNTER_IMG_WIDTH / 2,
	textY: Config.DEFAULT_COUNTER_IMG_HEIGHT / 2,
} as const;
