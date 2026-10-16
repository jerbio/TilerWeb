import colorUtil, { RGB } from './colors';

export type IconSurface = { background: string; foreground: string };
export type FilledSurface = { background: string; border: string; text: string };

/**
 * Icon-box treatment derived from a single hue: a tinted fill with a
 * contrasting glyph. Dark and light render distinct tonal treatments so the
 * accent reads correctly in both. Used by the detail header and tilette rows.
 */
export function iconSurface(rgb: RGB, isDarkMode: boolean): IconSurface {
	return {
		background: colorUtil.setLightness(rgb, isDarkMode ? 0.325 : 0.9).toHex(),
		foreground: colorUtil.setLightness(rgb, isDarkMode ? 0.85 : 0.3).toHex(),
	};
}

/**
 * Filled-card treatment derived from a single hue: a deep tonal fill, a tinted
 * border, and legible text. Used by the assignee-view tilette cards.
 */
export function filledSurface(rgb: RGB, isDarkMode: boolean): FilledSurface {
	return {
		background: colorUtil.setLightness(rgb, isDarkMode ? 0.18 : 0.93).toHex(),
		border: colorUtil.setLightness(rgb, isDarkMode ? 0.4 : 0.72).toHex(),
		text: colorUtil.setLightness(rgb, isDarkMode ? 0.92 : 0.28).toHex(),
	};
}
