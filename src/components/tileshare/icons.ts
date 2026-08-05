import { Diamond, DiamondPlus, Layers } from 'lucide-react';

/**
 * The icons that stand for each tileshare entity. Imported from here rather
 * than from lucide directly so the three stay consistent across the app —
 * cards, detail headers and rows all read from the same source.
 */

/** A single tileshare: one task shared with someone. */
export const SingleTileshareIcon = DiamondPlus;

/** A multi tileshare: the cluster holding many tilettes. */
export const MultiTileshareIcon = Layers;

/** A tilette: one assigned, completable task inside a cluster. */
export const TiletteIcon = Diamond;
