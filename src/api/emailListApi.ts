import { AppApi } from './appApi';

export class EmailListApi extends AppApi {
  submitEmail(email: string) {
    return this.apiRequest('api/emailList', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }
}
