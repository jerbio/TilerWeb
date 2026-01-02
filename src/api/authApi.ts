import { AppApi } from './appApi';

export interface SignUpRequest {
	email: string;
}

export interface SignUpResponse {
	userId: string;
	email: string;
}

export interface VerifyCodeRequest {
	email: string;
	code: string;
}

export interface VerifyCodeResponse {
	userId: string;
	email: string;
	verified: boolean;
}

export interface AuthStatusResponse {
	isAuthenticated: boolean;
	userId?: string;
	email?: string;
}

export class AuthApi extends AppApi {
	public signUp(email: string) {
		return this.apiRequest<SignUpResponse>('account/emailauthentication', {
			method: 'POST',
			body: JSON.stringify({ email }),
		});
	}

	public verifyCode(email: string, code: string) {
		return this.apiRequest<VerifyCodeResponse>('account/emailcodeauthentication', {
			method: 'POST',
			body: JSON.stringify({ email, code }),
		});
	}

	public async checkAuth(): Promise<AuthStatusResponse> {
		const endpoint = this.getUri('account/auth');

		try {
			const res = await fetch(endpoint, {
				method: 'GET',
				credentials: 'include', // Include authentication cookies
			});

			// If response is OK (200), user is authenticated
			if (res.ok) {
				return { isAuthenticated: true };
			}

			// Any other status means not authenticated
			return { isAuthenticated: false };
		} catch (error) {
			console.error('Error checking auth:', error);
			// If request fails, assume not authenticated
			return { isAuthenticated: false };
		}
	}

	public logout() {
		return this.apiRequest<void>('account/signout', {
			method: 'POST',
		});
	}
}
