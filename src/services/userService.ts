import { UserApi, UpdateUserRequest } from '@/api/userApi';
import { normalizeError } from '@/core/error';
import { TilerResponseError } from '@/core/common/types/errors';
// import { ApiCodeResponse } from '@/core/';


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
}
