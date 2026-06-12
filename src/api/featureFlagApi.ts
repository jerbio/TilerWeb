import type {
	AdminFeatureFlagResponse,
	AdminFlagsForUserResponse,
	AdminOverrideMutationResponse,
	AdminUserSearchResponse,
	FeatureFlagResponse,
	SelfToggleResponse,
} from '@/core/common/types/featureFlag';
import { AppApi } from './appApi';

export class FeatureFlagApi extends AppApi {
	getFlags() {
		return this.apiRequest<FeatureFlagResponse>('api/FeatureFlag');
	}

	/** User self-toggles a flag (must be UserToggleable). */
	selfToggle(flagId: string, enabled: boolean) {
		return this.apiRequest<SelfToggleResponse>(
			`api/FeatureFlag/${encodeURIComponent(flagId)}/self`,
			{
				method: 'PUT',
				body: JSON.stringify({ enabled }),
			}
		);
	}

	/** Admin: list all flag definitions (read-only). */
	adminGetAllFlags() {
		return this.apiRequest<AdminFeatureFlagResponse>('api/admin/FeatureFlag');
	}

	/** Admin: search users for the picker. */
	adminSearchUsers(search: string, take = 20) {
		const params = new URLSearchParams({ search, take: String(take) });
		return this.apiRequest<AdminUserSearchResponse>(`api/admin/users?${params.toString()}`);
	}

	/** Admin: get every flag + the override (if any) + resolved value for one user. */
	adminGetFlagsForUser(userId: string) {
		return this.apiRequest<AdminFlagsForUserResponse>(
			`api/admin/FeatureFlag/users/${encodeURIComponent(userId)}`
		);
	}

	/** Admin: upsert a user-scoped override on behalf of a user. */
	adminSetOverride(
		flagId: string,
		userId: string,
		isEnabled: boolean,
		expiresAtUtc: string | null = null
	) {
		return this.apiRequest<AdminOverrideMutationResponse>(
			`api/admin/FeatureFlag/${encodeURIComponent(flagId)}/users/${encodeURIComponent(userId)}`,
			{
				method: 'PUT',
				body: JSON.stringify({ isEnabled, expiresAtUtc }),
			}
		);
	}

	/** Admin: clear a user-scoped override, reverting to rollout default. */
	adminClearOverride(flagId: string, userId: string) {
		return this.apiRequest<AdminOverrideMutationResponse>(
			`api/admin/FeatureFlag/${encodeURIComponent(flagId)}/users/${encodeURIComponent(userId)}`,
			{
				method: 'DELETE',
			}
		);
	}
}

export const featureFlagApi = new FeatureFlagApi();
