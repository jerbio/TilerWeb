import { EmailListApi } from '@/api/emailListApi';
import { normalizeError } from '@/core/error';

export class EmailListService {
  private emailListApi: EmailListApi;

  constructor(emailListApi: EmailListApi) {
    this.emailListApi = emailListApi;
  }

  async submitEmail(email: string) {
    try {
      const response = await this.emailListApi.submitEmail(email);
      return response;
    } catch (error) {
      console.error('Error submitting email to list', error);
      throw normalizeError(error);
    }
  }
}
