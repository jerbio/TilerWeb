import palette from '@/core/theme/palette';
import { RGB } from '@/core/util/colors';

function hexToRgb(hex: string): RGB {
	const h = hex.replace('#', '');
	return {
		r: parseInt(h.slice(0, 2), 16),
		g: parseInt(h.slice(2, 4), 16),
		b: parseInt(h.slice(4, 6), 16),
	};
}

/**
 * Default icon accent — the brand colour. Used for every tileshare's header
 * icon until the backend provides a per-tileshare colour to override it. The
 * header derives both the icon-box background and glyph from this via
 * `colorUtil.setLightness`, so light and dark render distinct tonal treatments.
 */
export const BRAND_ACCENT: RGB = hexToRgb(palette.colors.brand[500]);
