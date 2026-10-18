import {
	Diamond,
	DiamondPlus,
	Layers,
	Megaphone,
	Share2,
	SquareKanban,
	UsersRound,
} from 'lucide-react';
import { TileshareMode } from '@/core/common/types/tileshare';

/** Match mobile's campaign, groups and kanban glyphs using the web icon family. */
export function tileshareModeIcon(mode?: TileshareMode | null) {
	switch (mode) {
		case TileshareMode.Broadcast:
			return Megaphone;
		case TileshareMode.Class:
			return UsersRound;
		case TileshareMode.Project:
			return SquareKanban;
		default:
			return Share2;
	}
}

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
