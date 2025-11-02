import { AuthApi } from '@/api/authApi';
import { normalizeError } from '@/core/error';

export class AuthService {
	private authApi: AuthApi;

	constructor(authApi: AuthApi) {
		this.authApi = authApi;
	}

	async signUp(email: string) {
		try {
			const response = await this.authApi.signUp(email);

			// Store token if provided
			if (response.token) {
				localStorage.setItem('tiler_bearer', response.token);
			}

			return response;
		} catch (error) {
			console.error('Error signing up', error);
			throw normalizeError(error);
		}
	}

	async verifyCode(email: string, code: string) {
		try {
			const response = await this.authApi.verifyCode(email, code);

			// Store token after successful verification
			if (response.token) {
				localStorage.setItem('tiler_bearer', response.token);
			}

			return response;
		} catch (error) {
			console.error('Error verifying code', error);
			throw normalizeError(error);
		}
	}
}
