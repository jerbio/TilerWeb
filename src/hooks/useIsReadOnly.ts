import useSimulationOverlayStore from '@/core/state/simulationOverlayStore';

/**
 * SCHEDULE READ-ONLY MODE
 * -----------------------
 * Returns true when the schedule must be treated as read-only:
 * no new tiles, no new blocks, no shuffling, no reoptimizing.
 *
 * TIER 1 (automatic): CalendarUI store actions for opening create-tile,
 * create-block, and create-selection flows consult `isScheduleReadOnly()`
 * and no-op when true. Any caller is protected without per-component code.
 *
 * TIER 2 (opt-in convention): All OTHER mutation surfaces (shuffle,
 * revise, procrastinate, future reoptimize) MUST consume `useIsReadOnly()`
 * to disable their button and short-circuit their handler. If you add a
 * new mutation surface, add this gate or document why it is exempt.
 *
 * Adding a new blocking trigger: OR the new condition into BOTH functions
 * below. Both must stay in sync (one for non-React reads, one for hooks).
 */

/**
 * Non-reactive read of the read-only state. Use from store actions,
 * services, and other non-React code paths that need a fresh value at
 * call time but should not subscribe.
 */
export function isScheduleReadOnly(): boolean {
	const { inReview } = useSimulationOverlayStore.getState();
	return inReview;
	// Future: || useScheduleStore.getState().isShuffling
	//       || useScheduleStore.getState().isReoptimizing
}

/**
 * React hook variant. Subscribes to the underlying source(s) and triggers
 * a re-render when read-only flips on or off.
 */
export function useIsReadOnly(): boolean {
	const inReview = useSimulationOverlayStore((s) => s.inReview);
	return inReview;
	// Future: const isShuffling = useScheduleStore((s) => s.isShuffling);
	//         return inReview || isShuffling;
}
