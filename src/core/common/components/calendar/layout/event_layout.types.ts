/**
 * Types for the stagger layout engine.
 */

/** Input event for the layout engine — minimal bounding box + identity */
export interface LayoutEvent {
	id: string;
	/** Start time in unix seconds */
	start: number;
	/** End time in unix seconds */
	end: number;
	/** Top position in pixels (from getBoundingBox) */
	y: number;
	/** Height in pixels (from getBoundingBox) */
	height: number;
	/** Left position in pixels (from getBoundingBox, day-column x) */
	x: number;
	/** Full column width in pixels (from getBoundingBox) */
	width: number;
}

/** Output layout info for a single event */
export interface StaggerResult {
	id: string;
	/** Stagger depth level (0 = no overlap, 1 = first overlap, etc.) */
	staggerLevel: number;
	/** Adjusted left position after stagger offset */
	x: number;
	/** Adjusted width after stagger offset */
	width: number;
	/** Z-index for layering: higher = rendered on top */
	zIndex: number;
	/** Adjusted height (enforced minimum) */
	height: number;
}

/** Options for the layout computation */
export interface StaggerLayoutOptions {
	/** Stagger increment in pixels per level */
	staggerIncrement: number;
	/** Maximum ratio of width consumed by stagger (0-1) */
	maxStaggerRatio: number;
	/** Minimum event height in pixels */
	minEventHeight: number;
}
