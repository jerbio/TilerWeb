import { LayoutEvent, StaggerResult, StaggerLayoutOptions } from './event_layout.types';

/**
 * Computes stagger layout for overlapping calendar events.
 *
 * Events cascade rightward with small left margin offsets based on overlap depth,
 * maintaining near-full width for readability. Z-index is determined by start time
 * and duration (shorter events rendered on top).
 *
 * Pure function — no side effects.
 */
export function computeStaggerLayout(
	events: LayoutEvent[],
	options: StaggerLayoutOptions
): StaggerResult[] {
	if (events.length === 0) return [];

	const { staggerIncrement, maxStaggerRatio, minEventHeight } = options;

	// Sort events: by start time asc, then by duration desc (longer events behind)
	const sorted = [...events].sort((a, b) => {
		const startDiff = a.start - b.start;
		if (startDiff !== 0) return startDiff;
		// Same start: longer duration first (gets lower stagger level / behind)
		return b.end - b.start - (a.end - a.start);
	});

	// Track active events (events whose time range hasn't ended yet)
	// Uses actual time (start/end) for overlap detection, NOT pixel positions,
	// because getBoundingBox enforces MIN_CELL_HEIGHT which inflates short events
	// and would cause false-positive overlaps with adjacent events.
	const active: Array<{ id: string; staggerLevel: number; end: number; x: number }> = [];

	const resultMap = new Map<string, StaggerResult>();

	for (let i = 0; i < sorted.length; i++) {
		const event = sorted[i];

		// Remove expired events from active list (events that ended before this one starts)
		// Uses time-based comparison to avoid false overlaps from min-height inflation
		for (let j = active.length - 1; j >= 0; j--) {
			if (active[j].end <= event.start) {
				active.splice(j, 1);
			}
		}

		// Only consider active events on the same day column (same x base)
		const overlapping = active.filter((a) => a.x === event.x);

		// Find the lowest available stagger level
		const usedLevels = new Set(overlapping.map((a) => a.staggerLevel));
		let staggerLevel = 0;
		while (usedLevels.has(staggerLevel)) {
			staggerLevel++;
		}

		// Cap the offset at maxStaggerRatio * event's full width
		const maxOffset = maxStaggerRatio * event.width;
		const rawOffset = staggerLevel * staggerIncrement;
		const offset = Math.min(rawOffset, maxOffset);

		const adjustedX = event.x + offset;
		const adjustedWidth = event.width - offset;
		const adjustedHeight = Math.max(event.height, minEventHeight);

		// Z-index: based on sort order (later start = higher, same start shorter = higher)
		// Since sorted is start asc + duration desc, index naturally gives correct z ordering
		const zIndex = i + 1;

		active.push({
			id: event.id,
			staggerLevel,
			end: event.end,
			x: event.x,
		});

		resultMap.set(event.id, {
			id: event.id,
			staggerLevel,
			x: adjustedX,
			width: adjustedWidth,
			zIndex,
			height: adjustedHeight,
		});
	}

	// Return results in the original input order
	return events.map((e) => resultMap.get(e.id)!);
}
