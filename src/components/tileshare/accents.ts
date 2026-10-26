import { RGB } from '@/core/util/colors';

/**
 * The single hue every tileshare entity icon is derived from — cluster cards,
 * detail headers and tilette rows alike. Each surface runs it through
 * `iconSurface` so light and dark render their own tonal treatment while the
 * icons stay one colour across the feature.
 */
export const TILESHARE_ACCENT: RGB = { r: 179, g: 196, b: 242 };
