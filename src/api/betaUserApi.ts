import { BetaUserBody } from '@/core/common/types/beta_user';
import { AppApi } from './appApi';

export class BetaUserApi extends AppApi {
	public signUp(betaUserBody: BetaUserBody) {
		const postBody = {
			...betaUserBody,
			FullUrl: window?.location?.href??"",
		}
		return this.apiRequest<void>('api/EmailList', {
			method: 'POST',
			body: JSON.stringify(postBody),
		});
	}
}
