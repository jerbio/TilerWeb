import type { HeroVariantDefinition } from './types';

/**
 * The roster is the only place an arm's participation is declared.
 *
 * Adding an arm is one entry. Retiring one is `enabled: false` — never a deletion,
 * so rows recorded against it stay interpretable.
 */
export const HERO_ROSTER: readonly HeroVariantDefinition[] = [
	{ key: 'control', enabled: true },
	{ key: 'nl_scheduling', enabled: true },
	{ key: 'stop_deciding', enabled: true },
	{ key: 'self_healing', enabled: true },
	{ key: 'task_splitting', enabled: true },
	{ key: 'capacity_check', enabled: true },
];
