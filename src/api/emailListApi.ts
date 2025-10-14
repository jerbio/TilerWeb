import { AppApi } from './appApi';
import { ServerError } from '@/core/common/types/errors';

export class EmailListApi extends AppApi {
  submitEmail(email: string) {
    return this.apiRequest<ServerError>('api/emailList', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }
}
