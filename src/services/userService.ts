import { UserApi } from '@/api/userApi';
import { normalizeError } from '@/core/error';

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
				throw new Error(response.Error.Message);
			}

			return response.Content.user;
		} catch (error) {
			console.error('Error fetching current user', error);
			throw normalizeError(error);
		}
	}
}
