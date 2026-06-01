import type {
	AdminFeatureFlagResponse,
	AdminUpdateFlagResponse,
	FeatureFlagResponse,
} from '@/core/common/types/featureFlag';
import { AppApi } from './appApi';

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
