/**
 * The current visitor's assignment.
 *
 * Deliberately React-free: the conversion tracker stamps every event with this,
 * and pulling React into that path would both bloat it and risk an import cycle.
 *
 * Resolved once per page load, in module scope. Re-resolving mid-session could
 * move a visitor between arms after they had already been counted.
 */

import { getAnonymousId } from '@/core/analytics/identity';
import type { ConversionExperiment } from '@/core/analytics/types';
import { resolveVariant } from './assignment';
import { isAutomated, readOverride, readPin } from './environment';
import { HERO_ROSTER } from './roster';
import { HERO_EXPERIMENT_KEY, type Assignment } from './types';

let cached: Assignment | null = null;

export const getHeroAssignment = (): Assignment => {
	if (cached) return cached;

	cached = resolveVariant({
		experimentKey: HERO_EXPERIMENT_KEY,
		anonymousId: getAnonymousId(),
		roster: HERO_ROSTER,
		automated: isAutomated(),
		override: readOverride(HERO_EXPERIMENT_KEY),
		pin: readPin(HERO_EXPERIMENT_KEY),
	});

	return cached;
};

/** Test-only. Production resolves once per page load and never re-resolves. */
export const resetHeroAssignment = (): void => {
	cached = null;
};

/**
 * Automated renders are omitted entirely rather than reported as `control`, so a
 * prerender snapshot can never be mistaken for a visitor in the control arm.
 */
export const getConversionExperiments = (): ConversionExperiment[] | undefined => {
	try {
		const assignment = getHeroAssignment();
		if (assignment.source === 'automated') return undefined;

		return [
			{
				key: assignment.experimentKey,
				variant: assignment.variant,
				forced: assignment.forced,
			},
		];
	} catch {
		// Never let experiment plumbing break conversion reporting.
		return undefined;
	}
};
