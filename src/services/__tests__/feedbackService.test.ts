import { vi } from 'vitest';
import { FeedbackService } from '../feedbackService';
import type { FeedbackApi } from '@/api/feedbackApi';

describe('FeedbackService', () => {
	const mockSuccessResponse = {
		Error: { Code: '0', Message: 'SUCCESS' },
		Content: null,
		ServerStatus: null,
	};

	it('calls feedbackApi.submitFeedback with correct params', async () => {
		const feedbackApiMock = {
			submitFeedback: vi.fn().mockResolvedValue(mockSuccessResponse),
		} as unknown as FeedbackApi;

		const service = new FeedbackService(feedbackApiMock);
		await service.submitFeedback({
			Category: 'Feature Request',
			Title: 'Dark mode',
			Description: 'Please add dark mode',
		});

		expect(feedbackApiMock.submitFeedback).toHaveBeenCalledWith({
			Category: 'Feature Request',
			Title: 'Dark mode',
			Description: 'Please add dark mode',
		});
	});

	it('throws when API returns error code', async () => {
		const feedbackApiMock = {
			submitFeedback: vi.fn().mockResolvedValue({
				Error: { Code: '1', Message: 'Something went wrong' },
				Content: null,
				ServerStatus: null,
			}),
		} as unknown as FeedbackApi;

		const service = new FeedbackService(feedbackApiMock);

		await expect(
			service.submitFeedback({
				Category: 'Bug',
				Title: 'Test',
				Description: 'Test',
			})
		).rejects.toThrow();
	});

	it('propagates network errors', async () => {
		const feedbackApiMock = {
			submitFeedback: vi.fn().mockRejectedValue(new Error('Network error')),
		} as unknown as FeedbackApi;

		const service = new FeedbackService(feedbackApiMock);

		await expect(
			service.submitFeedback({
				Category: 'Bug',
				Title: 'Test',
				Description: 'Test',
			})
		).rejects.toThrow();
	});
});
