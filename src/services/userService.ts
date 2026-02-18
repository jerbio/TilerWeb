import { UserApi, UpdateUserRequest, UserSettings, UpdateSettingsRequest } from '@/api/userApi';
import { normalizeError } from '@/core/error';
import { TilerResponseError } from '@/core/common/types/errors';

export class UserService {
	private userApi: UserApi;

	constructor(userApi: UserApi) {
		this.userApi = userApi;
	}

	async getCurrentUser() {
		try {
			const response = await this.userApi.getCurrentUser();

			// Check if the API returned an error
			if (response.Error.Code !== '0') {
				throw TilerResponseError.fromApiCodeResponse(response.Error);
			}

			return response.Content.user;
		} catch (error) {
			console.error('Error fetching current user', error);
			throw normalizeError(error);
		}
	}

	async updateUser(userData: UpdateUserRequest) {
		try {
			const response = await this.userApi.updateUser(userData);

			// Check if the API returned an error
			if (response.Error.Code !== '0') {
				throw TilerResponseError.fromApiCodeResponse(response.Error);
			}

			return response;
		} catch (errorResponse) {
			console.error('Error updating user', errorResponse);
			throw normalizeError(errorResponse);
		}
	}

	async getSettings(): Promise<UserSettings> {
		try {
			const response = await this.userApi.getSettings();

			// Check if the API returned an error
			if (response.Error.Code !== '0') {
				throw TilerResponseError.fromApiCodeResponse(response.Error);
			}

			return response.Content.settings;
		} catch (error) {
			console.error('Error fetching user settings', error);
			throw normalizeError(error);
		}
	}

	async updateSettings(settings: UpdateSettingsRequest): Promise<UserSettings> {
		try {
			const response = await this.userApi.updateSettings(settings);

			// Check if the API returned an error
			if (response.Error.Code !== '0') {
				throw TilerResponseError.fromApiCodeResponse(response.Error);
			}

			return response.Content.settings;
		} catch (error) {
			console.error('Error updating user settings', error);
			throw normalizeError(error);
		}
	}
}
