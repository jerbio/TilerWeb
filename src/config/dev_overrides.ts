import type { UserInfo } from '@/global_state';
import type { AdminFlagEntry } from '@/api/featureFlagApi';

/**
 * Dev-only overrides applied before state is set.
 * These intercept the backend response so the fake values flow through
 * the same code path as real data — no special-casing elsewhere.
 *
 * None of this code runs in production (tree-shaken via Env.isDevelopment() guard at call site).
 */

export const DEV_USER_OVERRIDES: Partial<UserInfo> = {
	isAdmin: true,
};

export const DEV_FEATURE_FLAGS: Record<string, boolean> = {
	'autofill-tile-details': true,
	'new-calendar-view': true,
	'chat-suggestions': false,
	'smart-scheduling': true,
};

export const DEV_ADMIN_FLAGS: AdminFlagEntry[] = [
	{ name: 'autofill-tile-details', isEnabledGlobal: true, rolloutPercent: null },
	{ name: 'new-calendar-view', isEnabledGlobal: true, rolloutPercent: null },
	{ name: 'chat-suggestions', isEnabledGlobal: false, rolloutPercent: null },
	{ name: 'smart-scheduling', isEnabledGlobal: true, rolloutPercent: null },
];

export function applyDevUserOverrides(user: UserInfo): UserInfo {
	return { ...user, ...DEV_USER_OVERRIDES };
}

export function applyDevFlagOverrides(flags: Record<string, boolean>): Record<string, boolean> {
	return { ...flags, ...DEV_FEATURE_FLAGS };
}
