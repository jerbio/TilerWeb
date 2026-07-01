import { FeedbackApi, FeedbackRequest } from '@/api/feedbackApi';
import { normalizeError } from '@/core/error';
import { TilerResponseError } from '@/core/common/types/errors';

export class FeedbackService {
	private feedbackApi: FeedbackApi;

	constructor(feedbackApi: FeedbackApi) {
		this.feedbackApi = feedbackApi;
	}

	async submitFeedback(feedback: FeedbackRequest) {
		try {
			const response = await this.feedbackApi.submitFeedback(feedback);

			if (response.Error.Code !== '0') {
				throw TilerResponseError.fromApiCodeResponse(response.Error);
			}

			return response;
		} catch (error) {
			console.error('Error submitting feedback', error);
			throw normalizeError(error);
		}
	}
}
