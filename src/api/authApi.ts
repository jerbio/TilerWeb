import { AppApi } from './appApi';

export interface SignUpRequest {
	email: string;
}

export interface SignUpResponse {
	userId: string;
	email: string;
	token?: string;
}

export interface VerifyCodeRequest {
	email: string;
	code: string;
}

export interface VerifyCodeResponse {
	userId: string;
	email: string;
	token: string;
	verified: boolean;
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
}
