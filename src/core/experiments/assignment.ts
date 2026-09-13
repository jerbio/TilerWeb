import {
	CONTROL_VARIANT,
	HERO_VARIANT_KEYS,
	type Assignment,
	type HeroVariantDefinition,
	type HeroVariantKey,
} from './types';
import { bucketOf } from './hash';

/**
 * Deliberately reads no clock, no timezone, and no arrival order. Binding an arm
 * to a time window would confound the variant with the visitor's local time of
 * day, and therefore with their region.
 */
export type ResolveInput = {
	experimentKey: string;
	anonymousId: string;
	roster: readonly HeroVariantDefinition[];
	/** Prerender, crawlers, and drivers. Suppresses the experiment entirely. */
	automated?: boolean;
	/** `?hero=` value, for QA and stakeholder review. */
	override?: string | null;
	/** Assignment pinned at first exposure. */
	pin?: string | null;
};

const isHeroVariantKey = (value: string | null | undefined): value is HeroVariantKey =>
	typeof value === 'string' && (HERO_VARIANT_KEYS as readonly string[]).includes(value);

const findVariant = (
	roster: readonly HeroVariantDefinition[],
	key: string | null | undefined
): HeroVariantDefinition | undefined =>
	isHeroVariantKey(key) ? roster.find((entry) => entry.key === key) : undefined;

/**
 * Strict precedence chain. The first source that yields a valid variant wins.
 *
 * Pure by design: storage, cookies, the URL, and the automation probe are all
 * resolved by the caller and passed in, so every branch is testable without a DOM.
 */
export const resolveVariant = (input: ResolveInput): Assignment => {
	const { experimentKey, anonymousId, roster, automated = false, override, pin } = input;

	if (automated) {
		return { experimentKey, variant: CONTROL_VARIANT, source: 'automated', forced: true };
	}

	// Honoured even for a retired arm: reviewing one is exactly why this exists.
	const overrideVariant = findVariant(roster, override);
	if (overrideVariant) {
		return { experimentKey, variant: overrideVariant.key, source: 'override', forced: true };
	}

	const eligible = roster.filter((entry) => entry.enabled);

	// A pin to a retired arm falls through: retiring an arm must stop serving it,
	// while pins on still-live arms keep those visitors off the shifted modulus.
	const pinned = findVariant(eligible, pin);
	if (pinned) {
		return { experimentKey, variant: pinned.key, source: 'pin', forced: false };
	}

	if (eligible.length === 0) {
		// Degenerate roster. Render something rather than nothing, but never count it.
		return { experimentKey, variant: CONTROL_VARIANT, source: 'hash', forced: true };
	}

	const index = bucketOf(anonymousId, experimentKey, eligible.length);
	return { experimentKey, variant: eligible[index].key, source: 'hash', forced: false };
};

/** Only organic assignments reach the results table. */
export const isCountedAssignment = (assignment: Assignment): boolean => !assignment.forced;

/** Synthetic traffic must not produce assignment rows at all. */
export const shouldRecordExposure = (assignment: Assignment): boolean =>
	assignment.source === 'hash' || assignment.source === 'pin';
