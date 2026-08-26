/**
 * Drives every demo through its scripted steps.
 *
 * Centralised because the failure that matters is the same for all four: a demo
 * that never reaches its terminal state never renders its signup nudge, which is
 * a dead conversion path that no unit test on the arm itself would catch.
 *
 * Under `prefers-reduced-motion` the scenario jumps straight to the final step,
 * so the nudge is reachable without any animation at all.
 */

import { useEffect, useRef, useState } from 'react';

/**
 * Every scenario runs for the same wall-clock duration regardless of how many
 * steps it has.
 *
 * Scenarios differ in step count because the stories differ, but if that made the
 * nudge appear sooner in some arms than others, those arms would get more nudge
 * exposure for reasons unrelated to their message. Pacing is normalised; the
 * story is not.
 *
 * Sized to let a displacement arc — disruption, resequence, settle — actually
 * read. Shorter and the recovery is over before the eye has followed it.
 */
export const DEMO_TOTAL_MS = 6000;

export const stepIntervalMs = (stepCount: number): number =>
	stepCount > 1 ? Math.round(DEMO_TOTAL_MS / (stepCount - 1)) : DEMO_TOTAL_MS;

const prefersReducedMotion = (): boolean => {
	if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
	return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

export type ScenarioState = {
	/** Zero-based index of the current step. */
	step: number;
	/** True once the scenario has reached its last step. Latched, never cleared. */
	complete: boolean;
};

export type ScenarioOptions = {
	/**
	 * Replay the scenario after it settles.
	 *
	 * A one-shot demo is over within seconds of load, so a visitor who arrives a
	 * moment late sees a static picture and never learns that the schedule moves.
	 * Looping keeps the motion observable. `complete` still latches on the first
	 * pass, so the nudge appears on the same wall-clock budget as every other arm
	 * and never disappears again.
	 */
	loop?: boolean;
};

/**
 * @param stepCount total steps, including the terminal one
 * @param active pauses the scenario until the demo is on screen
 */
export const useDemoScenario = (
	stepCount: number,
	active = true,
	options: ScenarioOptions = {}
): ScenarioState => {
	const { loop = false } = options;
	const reduced = useRef(prefersReducedMotion());
	const [step, setStep] = useState(() => (reduced.current ? stepCount - 1 : 0));
	const [complete, setComplete] = useState(() => reduced.current);

	useEffect(() => {
		if (!active || reduced.current) return;
		if (!loop && step >= stepCount - 1) return;

		// Step is derived from elapsed time rather than chained timeouts, so a tick
		// that fires late catches up instead of pushing the whole scenario back.
		// Every arm therefore reaches its nudge in the same wall-clock budget, and
		// no arm gets extra nudge exposure just because its story needs more steps.
		const startedAt = Date.now();
		const interval = stepIntervalMs(stepCount);
		// One extra interval of hold on the settled state before replaying.
		const cycle = interval * stepCount;

		const tick = setInterval(() => {
			const elapsed = Date.now() - startedAt;
			if (elapsed >= DEMO_TOTAL_MS) setComplete(true);

			if (!loop) {
				const next = Math.min(stepCount - 1, Math.round(elapsed / interval));
				setStep((current) => (next > current ? next : current));
				return;
			}

			setStep(Math.min(stepCount - 1, Math.round((elapsed % cycle) / interval)));
		}, interval);

		return () => clearInterval(tick);
		// Runs once per activation: the interval drives every step itself.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [active, stepCount, loop]);

	return { step, complete: complete || step >= stepCount - 1 };
};
