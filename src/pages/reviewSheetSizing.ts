// Mobile review bottom-sheet sizing rules.
//
// Extracted so the height/max-height contract can be unit-tested without
// having to render the entire Timeline page. The styled `SidePanelContainer`
// in `Timeline.tsx` calls into this helper.
//
// Four discrete vertical stops:
//   - hidden : grab-pill only, calendar fully visible underneath → 28 px
//   - peek   : header only                                       → 96 px
//   - mid    : header + stepper + Apply/Exit footer              → 220 px
//   - full   : everything (action list)                          → auto, capped at 70vh
//
// The fixed sizes act as deterministic snap points so the user knows
// what they will get before tapping the toggle. `full` shrinks to fit
// content so a one-action review doesn't leave dead space. `hidden`
// collapses to just the grab pill so the user can still tap to restore
// without exiting review mode.

export type ReviewStop = 'hidden' | 'peek' | 'mid' | 'full';

export interface MobileReviewSheetSizing {
	height: string;
	maxHeight: string;
}

export const HIDDEN_SHEET_HEIGHT_PX = 28;
export const PEEK_SHEET_HEIGHT_PX = 96;
export const MID_SHEET_HEIGHT_PX = 220;
export const FULL_SHEET_MAX_VH = 70;

export function getMobileReviewSheetSizing(stop: ReviewStop): MobileReviewSheetSizing {
	switch (stop) {
		case 'hidden':
			return {
				height: `${HIDDEN_SHEET_HEIGHT_PX}px`,
				maxHeight: `${HIDDEN_SHEET_HEIGHT_PX}px`,
			};
		case 'peek':
			return {
				height: `${PEEK_SHEET_HEIGHT_PX}px`,
				maxHeight: `${PEEK_SHEET_HEIGHT_PX}px`,
			};
		case 'mid':
			return {
				height: `${MID_SHEET_HEIGHT_PX}px`,
				maxHeight: `${MID_SHEET_HEIGHT_PX}px`,
			};
		case 'full':
		default:
			return {
				height: 'auto',
				maxHeight: `${FULL_SHEET_MAX_VH}vh`,
			};
	}
}

/**
 * Approximate pixel height of the sheet at a given stop, for use in
 * layout calculations (e.g. choosing where to place a popout so it isn't
 * occluded). Returns the FULL_SHEET_MAX_VH fraction for the `full` stop
 * since the actual height depends on viewport / content.
 */
export function getMobileReviewSheetHeightPx(stop: ReviewStop, viewportHeight: number): number {
	switch (stop) {
		case 'hidden':
			return HIDDEN_SHEET_HEIGHT_PX;
		case 'peek':
			return PEEK_SHEET_HEIGHT_PX;
		case 'mid':
			return MID_SHEET_HEIGHT_PX;
		case 'full':
		default:
			return Math.round(viewportHeight * (FULL_SHEET_MAX_VH / 100));
	}
}

/** Inline CSS fragment that the styled-component splices into its template. */
export function getMobileReviewSheetSizingCss(stop: ReviewStop): string {
	const { height, maxHeight } = getMobileReviewSheetSizing(stop);
	return `height: ${height}; max-height: ${maxHeight};`;
}
