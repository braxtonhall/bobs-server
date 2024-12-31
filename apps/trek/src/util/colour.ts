import tinycolor from "tinycolor2";

type Colour = Parameters<typeof tinycolor>[0];

export const isDark = (colour: Colour): boolean => tinycolor(colour).isDark();

export const isVeryLight = (colour: Colour): boolean => tinycolor(colour).getBrightness() > 250;

export const lighten = (colour: Colour, amount: number) => tinycolor(colour).lighten(amount).toString("hex8");
export const darken = (colour: Colour, amount: number) => tinycolor(colour).darken(amount).toString("hex8");

export const overlay = (back: Colour, front: Colour) => {
	const tinyBack = tinycolor(back);
	const frgba = tinycolor(front).toRgb();
	if (frgba.a) {
		const brgba = tinyBack.toRgb();
		const a = 1 - (1 - frgba.a) * (1 - brgba.a);
		const r = Math.round((frgba.r * frgba.a) / a + (brgba.r * brgba.a * (1 - frgba.a)) / a);
		const g = Math.round((frgba.g * frgba.a) / a + (brgba.g * brgba.a * (1 - frgba.a)) / a);
		const b = Math.round((frgba.b * frgba.a) / a + (brgba.b * brgba.a * (1 - frgba.a)) / a);
		return tinycolor({ r, g, b, a }).toString("hex8");
	} else {
		return tinyBack.toString("hex8");
	}
};
