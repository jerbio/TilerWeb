import { create } from 'zustand';
import { SimulationDto, SimulationScheduleResult, VibeRequest } from '@/core/common/types/chat';

// ---------------------------------------------------------------------------
// Phase 5 — Cross-component simulation overlay store
// ---------------------------------------------------------------------------
// `chat.tsx` (publisher) writes simulation state when the user enters/exits
// review mode. `CalendarWrapper` (subscriber) reads to swap its events array
// for the overlay and to render the mode banner. Decoupling chat ↔ calendar
// through a tiny store avoids prop-drilling through Timeline.tsx and keeps
// both surfaces ignorant of each other's internals.
//
// Plan §5.1.1 frames the channel as a `simulationOverlay` prop on
// CalendarWrapper; the prop interface is achievable by hoisting state to
// Timeline.tsx but adds two extra hops with no upside. The store presents
// the same data and is local to the simulation feature.
// ---------------------------------------------------------------------------

export type ComparisonView = 'simulation' | 'current';

/**
 * Mobile-only collapse state for the review bottom sheet. Four discrete
 * stops give the user predictable control over how much of the calendar
 * grid is visible while reviewing a tilecast:
 *   - 'hidden': fully collapsed; calendar fully visible behind sheet     0px
 *   - 'peek'  : header only (current action title + handle)            ~96px
 *   - 'mid'   : header + stepper + Apply / Exit footer                ~220px
 *   - 'full'  : everything including the action list                  ~70vh
 * On desktop the side panel always renders the 'full' view; this state is
 * ignored.
 */
export type ReviewStop = 'hidden' | 'peek' | 'mid' | 'full';

export interface SimulationOverlayState {
	/** True iff the user has entered review mode for the active request. */
	inReview: boolean;
	/** Active simulation metadata (state, previewActions, etc.). */
	simulation: SimulationDto | null;
	/** Lazy-fetched preview schedule dump (Phase 4.2). */
	simulationResult: SimulationScheduleResult | null;
	/** The VibeRequest that produced the simulation. */
	vibeRequest: VibeRequest | null;
	/** Toggle inside review — flips calendar grid between overlay and live. */
	comparisonView: ComparisonView;
	/** Currently-selected action id (single source of truth, see §5.3.3). */
	selectedActionId: string | null;
	/** Mobile bottom-sheet collapse stop (peek / mid / full). */
	reviewStop: ReviewStop;

	enterReview: (args: {
		simulation: SimulationDto;
		simulationResult: SimulationScheduleResult;
		vibeRequest: VibeRequest;
	}) => void;
	exitReview: () => void;
	setComparisonView: (v: ComparisonView) => void;
	setSelectedActionId: (id: string | null) => void;
	setReviewStop: (stop: ReviewStop) => void;
	cycleReviewStop: () => void;
	/** Update the simulationResult in-place (for refresh on stale, §5.4). */
	setSimulationResult: (r: SimulationScheduleResult | null) => void;
}

const useSimulationOverlayStore = create<SimulationOverlayState>((set) => ({
	inReview: false,
	simulation: null,
	simulationResult: null,
	vibeRequest: null,
	comparisonView: 'simulation',
	selectedActionId: null,
	reviewStop: 'full',

	enterReview: ({ simulation, simulationResult, vibeRequest }) => {
		// Plan §5.3 — auto-select the first reviewable action so chips,
		// calendar overlay, review panel rows, and the Previous/Next
		// stepper all share a non-null starting selection. Source from
		// `simulation.previewActions` (same source the chip row and review
		// panel iterate); `vibeRequest.actions` is sometimes empty on the
		// wire even when previewActions has entries.
		const firstPreview = (simulation.previewActions ?? []).find(
			(pa) => !!(pa.actionId ?? pa.action?.id)
		);
		const firstId =
			firstPreview?.actionId ??
			firstPreview?.action?.id ??
			vibeRequest.actions?.[0]?.id ??
			null;
		set({
			inReview: true,
			simulation,
			simulationResult,
			vibeRequest,
			comparisonView: 'simulation',
			selectedActionId: firstId,
			reviewStop: 'full',
		});
	},

	exitReview: () =>
		set({
			inReview: false,
			selectedActionId: null,
			comparisonView: 'simulation',
			reviewStop: 'full',
		}),

	setComparisonView: (comparisonView) => set({ comparisonView }),
	setSelectedActionId: (selectedActionId) => set({ selectedActionId }),
	setReviewStop: (reviewStop) => set({ reviewStop }),
	cycleReviewStop: () =>
		set((state) => {
			const order: ReviewStop[] = ['hidden', 'peek', 'mid', 'full'];
			const next = order[(order.indexOf(state.reviewStop) + 1) % order.length];
			return { reviewStop: next };
		}),
	setSimulationResult: (simulationResult) => set({ simulationResult }),
}));

export default useSimulationOverlayStore;
