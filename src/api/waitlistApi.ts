import { AppApi } from '@/api/appApi';

export class WaitlistApi extends AppApi {
  joinWaitlist(email: string) {
    return this.apiRequest('api/EmailList', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }
}
