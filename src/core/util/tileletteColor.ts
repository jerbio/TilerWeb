import { RGB } from './colors';

/**
 * Base hues a tilette's colour is picked from. Chosen from the theme palette so
 * they sit alongside the rest of the app. A tilette keeps the same colour in
 * both the list and assignee views because the pick is a stable hash of its id.
 */
const TILETTE_PALETTE: RGB[] = [
	{ r: 0x61, g: 0x72, b: 0xf3 }, // indigo
	{ r: 0x7a, g: 0x5a, b: 0xf8 }, // purple
	{ r: 0x12, g: 0xb7, b: 0x6a }, // green
	{ r: 0xf6, g: 0x3d, b: 0x68 }, // rose
	{ r: 0xf7, g: 0x90, b: 0x09 }, // amber
	{ r: 0x05, g: 0xa3, b: 0x9c }, // teal
	{ r: 0x2e, g: 0x90, b: 0xfa }, // blue
	{ r: 0xef, g: 0x68, b: 0x20 }, // orange
];

/**
 * Stable per-tilette colour. Hashes the tilette id into the palette so the same
 * tilette always resolves to the same hue, across renders and both views.
 * Falls back to the first hue when the id is missing.
 */
export function getTileletteColor(id: string | null | undefined): RGB {
	if (!id) return TILETTE_PALETTE[0];
	let hash = 0;
	for (let i = 0; i < id.length; i++) {
		hash = (hash * 31 + id.charCodeAt(i)) | 0;
	}
	return TILETTE_PALETTE[Math.abs(hash) % TILETTE_PALETTE.length];
}
