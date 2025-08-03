export type RGB = { r: number; g: number; b: number };
export type HSL = { h: number; s: number; l: number };

function rgbToHsl({ r, g, b }: RGB): HSL {
	// eslint-disable-next-line @typescript-eslint/no-unused-expressions
	(r /= 255), (g /= 255), (b /= 255);
	const vmax = Math.max(r, g, b),
		vmin = Math.min(r, g, b);
	let h = (vmax + vmin) / 2;
	let s = (vmax + vmin) / 2;
	const l = (vmax + vmin) / 2;

	if (vmax === vmin) {
		return { h: 0, s: 0, l }; // achromatic
	}

	const d = vmax - vmin;
	s = l > 0.5 ? d / (2 - vmax - vmin) : d / (vmax + vmin);
	if (vmax === r) h = (g - b) / d + (g < b ? 6 : 0);
	if (vmax === g) h = (b - r) / d + 2;
	if (vmax === b) h = (r - g) / d + 4;
	h /= 6;

	return { h, s, l };
}

function hueToRgb(p: number, q: number, t: number): number {
	if (t < 0) t += 1;
	if (t > 1) t -= 1;
	if (t < 1 / 6) return p + (q - p) * 6 * t;
	if (t < 1 / 2) return q;
	if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
	return p;
}

function hslToRgb({ h, s, l }: HSL): RGB {
	let r, g, b;

	if (s === 0) {
		r = g = b = l; // achromatic
	} else {
		const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
		const p = 2 * l - q;
		r = hueToRgb(p, q, h + 1 / 3);
		g = hueToRgb(p, q, h);
		b = hueToRgb(p, q, h - 1 / 3);
	}

	return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
}

const colorUtil = {
	setLightness: (rgb: RGB, lightness: number): RGB => {
		const hsl = rgbToHsl(rgb);
		hsl.l = lightness;
		return hslToRgb(hsl);
	},
	lighten: (rgb: RGB, amount: number): RGB => {
		const hsl = rgbToHsl(rgb);
		hsl.l = Math.min(0.9, hsl.l + amount);
		return hslToRgb(hsl);
	},
	darken: (rgb: RGB, amount: number): RGB => {
		const hsl = rgbToHsl(rgb);
		hsl.l = Math.max(0.2, hsl.l - amount);
		return hslToRgb(hsl);
	},
};

export default colorUtil;
