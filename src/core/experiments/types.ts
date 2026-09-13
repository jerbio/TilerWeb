/**
 * Shared types for the hero variant experiment.
 *
 * See HERO_EXPERIMENT_DESIGN.md for the assignment contract this implements.
 */

import type { Attribution } from '@/core/analytics/types';

export const HERO_EXPERIMENT_KEY = 'hero_v1';

export const HERO_VARIANT_KEYS = [
	'control',
	'nl_scheduling',
	'stop_deciding',
	'self_healing',
	'task_splitting',
	'capacity_check',
] as const;

export type HeroVariantKey = (typeof HERO_VARIANT_KEYS)[number];

/** Served to automation, and to any visitor a degenerate roster cannot bucket. */
export const CONTROL_VARIANT: HeroVariantKey = 'control';

/**
 * Retiring an arm is `enabled: false`, never a deletion, so recorded rows stay
 * interpretable after the roster changes.
 */
export type HeroVariantDefinition = {
	key: HeroVariantKey;
	enabled: boolean;
};

/**
 * Named so a silent no-op is impossible to confuse with a real assignment.
 * `automated` and `override` never reach the results.
 */
export type AssignmentSource = 'automated' | 'override' | 'pin' | 'hash';

export type Assignment = {
	experimentKey: string;
	variant: HeroVariantKey;
	source: AssignmentSource;
	/** True for anything synthetic. Excluded from analysis. */
	forced: boolean;
};

export type ExposurePayload = {
	eventId: string;
	experimentKey: string;
	variantKey: HeroVariantKey;
	anonymousId: string;
	sessionId: string;
	occurredAt: string;
	source: Exclude<AssignmentSource, 'automated'>;
	forced: boolean;
	locale: string;
	landingPath: string;
	firstTouch: Attribution | null;
};

/** Snapshot stamped onto every conversion event so the funnel is segmentable. */
export type ExperimentAssignmentSnapshot = {
	key: string;
	variant: string;
	forced: boolean;
};
