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
			return response;
		} catch (error) {
			console.error('Error signing up', error);
			throw normalizeError(error);
		}
	}

	async verifyCode(email: string, code: string) {
		try {
			const response = await this.authApi.verifyCode(email, code);
			return response;
		} catch (error) {
			console.error('Error verifying code', error);
			throw normalizeError(error);
		}
	}

	async checkAuth() {
		try {
			const response = await this.authApi.checkAuth();
			return response;
		} catch (error) {
			console.error('Error checking auth status', error);
			throw normalizeError(error);
		}
	}

	async logout() {
		try {
			await this.authApi.logout();
		} catch (error) {
			console.error('Error logging out', error);
			throw normalizeError(error);
		}
	}
}
