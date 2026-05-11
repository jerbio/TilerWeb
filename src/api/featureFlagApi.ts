import { AppApi } from './appApi';

interface FeatureFlagResponse {
	Error: { Code: string; Message: string } | null;
	Content: { flags: Record<string, boolean> };
	ServerStatus: number;
}

export interface AdminFlagEntry {
	name: string;
	isEnabledGlobal: boolean;
	rolloutPercent: number | null;
}

interface AdminFeatureFlagResponse {
	Error: { Code: string; Message: string } | null;
	Content: { flags: AdminFlagEntry[] };
	ServerStatus: number;
}

interface AdminUpdateFlagResponse {
	Error: { Code: string; Message: string } | null;
	Content: { flag: AdminFlagEntry };
	ServerStatus: number;
}

export class FeatureFlagApi extends AppApi {
	getFlags() {
		return this.apiRequest<FeatureFlagResponse>('api/FeatureFlag');
	}

	adminGetAllFlags() {
		return this.apiRequest<AdminFeatureFlagResponse>('api/admin/FeatureFlag');
	}

	adminUpdateFlag(name: string, isEnabledGlobal: boolean, rolloutPercent: number | null) {
		return this.apiRequest<AdminUpdateFlagResponse>(
			`api/admin/FeatureFlag/${encodeURIComponent(name)}`,
			{
				method: 'PUT',
				body: JSON.stringify({ isEnabledGlobal, rolloutPercent }),
			}
		);
	}
}

export const featureFlagApi = new FeatureFlagApi();
