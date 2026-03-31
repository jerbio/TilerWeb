import { ApiResponse } from '@/core/common/types/api';
import { AppApi } from './appApi';

export interface FeedbackRequest {
	Category: string;
	Title: string;
	Description: string;
}

export type FeedbackResponse = ApiResponse<null>;

export class FeedbackApi extends AppApi {
	public submitFeedback(feedback: FeedbackRequest) {
		return this.apiRequest<FeedbackResponse>('api/User/Feedback', {
			method: 'POST',
			body: JSON.stringify(feedback),
		});
	}
}
