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

	enterReview: (args: {
		simulation: SimulationDto;
		simulationResult: SimulationScheduleResult;
		vibeRequest: VibeRequest;
	}) => void;
	exitReview: () => void;
	setComparisonView: (v: ComparisonView) => void;
	setSelectedActionId: (id: string | null) => void;
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
		});
	},

	exitReview: () =>
		set({
			inReview: false,
			selectedActionId: null,
			comparisonView: 'simulation',
		}),

	setComparisonView: (comparisonView) => set({ comparisonView }),
	setSelectedActionId: (selectedActionId) => set({ selectedActionId }),
	setSimulationResult: (simulationResult) => set({ simulationResult }),
}));

export default useSimulationOverlayStore;
