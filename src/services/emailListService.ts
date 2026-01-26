import { EmailListApi } from '@/api/emailListApi';
import { ApiResponse } from '@/core/common/types/api';
import { normalizeError } from '@/core/error';

export class EmailListService {
  private emailListApi: EmailListApi;

  constructor(emailListApi: EmailListApi) {
    this.emailListApi = emailListApi;
  }

  async submitEmail(email: string, uiFlow?: string, tilerUserId?: string): Promise<ApiResponse<unknown>> {
    try {
      const response = await this.emailListApi.submitEmail(email, uiFlow, tilerUserId);
      return response;
    } catch (error) {
      console.error('Error submitting email to list', error);
      throw normalizeError(error);
    }
  }
}
