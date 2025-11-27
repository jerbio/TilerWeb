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

	public checkAuth() {
		return this.apiRequest<string>('account/auth', {
			method: 'GET',
			responseType: 'text', // Backend returns "OK" as plain text, not JSON
		});
	}

	public logout() {
		return this.apiRequest<void>('account/signout', {
			method: 'POST',
		});
	}
}
