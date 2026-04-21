import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FeedbackApi } from '../feedbackApi';

vi.mock('@/config/config_getter', () => ({
	Env: {
		get: () => 'https://test.example.com/',
	},
}));

const fetchSpy = vi.spyOn(globalThis, 'fetch');

describe('FeedbackApi', () => {
	let api: FeedbackApi;

	const mockSuccessResponse = {
		Error: { Code: '0', Message: 'SUCCESS' },
		Content: null,
		ServerStatus: null,
	};

	beforeEach(() => {
		api = new FeedbackApi();
		fetchSpy.mockReset();
	});

	describe('submitFeedback', () => {
		it('sends POST request to api/User/Feedback with correct body', async () => {
			fetchSpy.mockResolvedValueOnce(
				new Response(JSON.stringify(mockSuccessResponse), {
					status: 200,
					headers: { 'Content-Type': 'application/json' },
				})
			);

			await api.submitFeedback({
				Category: 'Bug',
				Title: 'Something broke',
				Description: 'Details about the bug',
			});

			expect(fetchSpy).toHaveBeenCalledOnce();
			const [urlArg, options] = fetchSpy.mock.calls[0];
			const urlStr =
				urlArg instanceof Request
					? urlArg.url
					: typeof urlArg === 'string'
						? urlArg
						: String(urlArg);
			expect(urlStr).toContain('api/User/Feedback');

			const method = urlArg instanceof Request ? urlArg.method : options?.method;
			expect(method).toBe('POST');

			const bodyStr =
				urlArg instanceof Request ? await urlArg.text() : (options?.body as string);
			const body = JSON.parse(bodyStr);
			expect(body).toEqual({
				Category: 'Bug',
				Title: 'Something broke',
				Description: 'Details about the bug',
			});
		});

		it('throws on network error', async () => {
			fetchSpy.mockRejectedValueOnce(new Error('Network error'));
			await expect(
				api.submitFeedback({
					Category: 'Bug',
					Title: 'Test',
					Description: 'Test',
				})
			).rejects.toThrow();
		});
	});
});
