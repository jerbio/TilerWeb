type RGB = {
	r: number;
	g: number;
	b: number;
};

const colorUtil = {
	lighten: (color: RGB, amount: number): RGB => {
		const { r, g, b } = color;
		return {
			r: Math.min(255, Math.round(r * (1 + amount))),
			g: Math.min(255, Math.round(g * (1 + amount))),
			b: Math.min(255, Math.round(b * (1 + amount))),
		};
	},
	darken: (color: RGB, amount: number): RGB => {
		const { r, g, b } = color;
		return {
			r: Math.max(0, Math.round(r * (1 - amount))),
			g: Math.max(0, Math.round(g * (1 - amount))),
			b: Math.max(0, Math.round(b * (1 - amount))),
		};
	},
};

export default colorUtil;
