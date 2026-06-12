import { ApiResponse } from './api';

export type FeatureFlagResponse = ApiResponse<{
	flags: Record<string, boolean>;
}>;

/** Source of an override row, as a string per FeatureFlagOverride.CreatedBySource. */
export type OverrideSource = 'PPS' | 'TilerFront_Self';

/** A flag definition row returned by GET /api/admin/FeatureFlag. */
export interface AdminFlagEntry {
	flagId: string;
	name: string;
	description: string | null;
	isEnabledGlobal: boolean;
	rolloutPercent: number | null;
	userToggleable: boolean;
}

export type AdminFeatureFlagResponse = ApiResponse<{
	flags: AdminFlagEntry[];
}>;

export interface AdminUserSummary {
	id: string;
	userName: string;
	email: string | null;
}

export type AdminUserSearchResponse = ApiResponse<{
	users: AdminUserSummary[];
}>;

export interface AdminUserOverride {
	isEnabled: boolean;
	createdBySource: OverrideSource;
	createdUtc: string;
	updatedUtc: string;
	expiresAtUtc: string | null;
}

/** One row of GET /api/admin/FeatureFlag/users/{userId}. */
export interface AdminUserFlagRow extends AdminFlagEntry {
	resolvedEnabled: boolean;
	override: AdminUserOverride | null;
}

export type AdminFlagsForUserResponse = ApiResponse<{
	flagsForUser: {
		user: AdminUserSummary;
		flags: AdminUserFlagRow[];
	};
}>;

export type AdminOverrideMutationResponse = ApiResponse<{
	override: {
		flagId: string;
		flag: string;
		userId: string;
		isEnabled?: boolean;
		expiresAtUtc?: string | null;
		cleared?: boolean;
	};
}>;

export type SelfToggleResponse = ApiResponse<{
	self_toggle: { flagId: string; flag: string; enabled: boolean };
}>;
