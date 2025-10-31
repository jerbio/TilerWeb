import { AppApi } from './appApi';
import { ServerError } from '@/core/common/types/errors';

export class EmailListApi extends AppApi {
  submitEmail(email: string, uiFlow?: string, tilerUserId?: string) {
    return this.apiRequest<ServerError>('api/emailList', {
      method: 'POST',
      body: JSON.stringify({
        email,
        ...(uiFlow && { UiFlow: uiFlow }),
        // Optional TilerUserId sent when provided (backend expects key name 'TilerUserId')
        ...(tilerUserId && { TilerUserId: tilerUserId }),
      }),
    });
  }
}
