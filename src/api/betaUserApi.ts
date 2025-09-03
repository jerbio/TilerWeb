import { BetaUserBody } from '@/core/common/types/beta_user';
import { AppApi } from './appApi';

export class BetaUserApi extends AppApi {
	public signUp(betaUserBody: BetaUserBody) {
		return this.apiRequest<void>('api/BetaUser/Post', {
			method: 'POST',
			body: JSON.stringify(betaUserBody),
		});
	}
}
