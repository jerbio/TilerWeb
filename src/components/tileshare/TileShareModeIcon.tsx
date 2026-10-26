import { TileshareMode } from '@/core/common/types/tileshare';
import { tileshareModeIcon } from './icons';

/** Mode labels live alongside the glyph; unknown modes use a neutral share icon. */
export default function TileShareModeIcon({
	mode,
	size = 22,
}: {
	mode?: TileshareMode | null;
	size?: number;
}) {
	const Icon = tileshareModeIcon(mode);
	return <Icon size={size} aria-hidden="true" focusable="false" />;
}
