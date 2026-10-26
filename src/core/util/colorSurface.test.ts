import { iconSurface, filledSurface } from './colorSurface';

const RED = { r: 237, g: 18, b: 59 };
const HEX = /^#[0-9a-f]{6}$/;

describe('iconSurface', () => {
	it('returns hex background and foreground', () => {
		const s = iconSurface(RED, true);
		expect(s.background).toMatch(HEX);
		expect(s.foreground).toMatch(HEX);
	});

	it('renders differently in dark vs light', () => {
		expect(iconSurface(RED, true).background).not.toBe(iconSurface(RED, false).background);
		expect(iconSurface(RED, true).foreground).not.toBe(iconSurface(RED, false).foreground);
	});
});

describe('filledSurface', () => {
	it('returns hex background, border and text', () => {
		const s = filledSurface(RED, true);
		expect(s.background).toMatch(HEX);
		expect(s.border).toMatch(HEX);
		expect(s.text).toMatch(HEX);
	});

	it('renders differently in dark vs light', () => {
		expect(filledSurface(RED, true).background).not.toBe(filledSurface(RED, false).background);
	});
});
