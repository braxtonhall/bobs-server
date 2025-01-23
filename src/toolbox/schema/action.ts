import tinycolor from "tinycolor2";
import { z } from "zod";
import Config from "../../Config";
import { checkboxSchema } from "../../schema";

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

export enum FontFamily {
	// common web-safe fonts
	ARIAL = "Arial",
	VERDANA = "Verdana",
	TAHOMA = "Tahoma",
	TREBUCHET_MS = '"Trebuchet MS"',
	TIMES_NEW_ROMAN = '"Times New Roman"',
	GEORGIA = "Georgia",
	GARAMOND = "Garamond", // TODO does not work on my machine
	COURIER_NEW = '"Courier New"',
	BRUSH_SCRIPT_MT = '"Brush Script MT"',
	// generic fallback fonts
	SERIF = "serif",
	SANS_SERIF = "sans-serif",
	CURSIVE = "cursive", // TODO does not work on my machine
	FANTASY = "fantasy",
	MONOSPACE = "monospace",
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
		fontFamily: z.nativeEnum(FontFamily),
		fontSize: z.coerce.number().int().min(0),
		fontStyle: z.nativeEnum(FontStyle),
		fontWeight: z.coerce.number().int().multipleOf(100).min(100).max(900),
		mimeType: z.nativeEnum(MimeType),
		unique: checkboxSchema,
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
	backgroundColorR: 0,
	backgroundColorG: 0,
	backgroundColorB: 0,
	backgroundColorA: 0,
	width: Config.DEFAULT_COUNTER_IMG_WIDTH,
	height: Config.DEFAULT_COUNTER_IMG_HEIGHT,
	textAlign: TextAlign.LEFT,
	textBaseline: TextBaseline.ALPHABETIC,
	fontFamily: FontFamily.COURIER_NEW,
	fontSize: 12,
	fontStyle: FontStyle.NORMAL,
	fontWeight: 400,
	mimeType: MimeType.PNG,
	unique: false,
} as const;
