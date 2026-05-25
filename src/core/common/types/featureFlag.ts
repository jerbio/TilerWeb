import { ApiResponse } from './api';

export type FeatureFlagResponse = ApiResponse<{
	flags: Record<string, boolean>;
}>;

export interface AdminFlagEntry {
	name: string;
	isEnabledGlobal: boolean;
	rolloutPercent: number | null;
}

export type AdminFeatureFlagResponse = ApiResponse<{
	flags: AdminFlagEntry[];
}>;

export type AdminUpdateFlagResponse = ApiResponse<{
	flag: AdminFlagEntry;
}>;
