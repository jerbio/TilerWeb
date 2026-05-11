import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FeatureFlagApi } from '@/api/featureFlagApi';

vi.mock('@/config/config_getter', () => ({
	Env: {
		get: () => '/',
		isDevelopment: () => false,
		isProduction: () => true,
	},
}));

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

const okJson = (body: unknown) =>
	Promise.resolve(
		new Response(JSON.stringify(body), {
			status: 200,
			headers: { 'Content-Type': 'application/json' },
		})
	);

const errorResponse = (status: number) =>
	Promise.resolve(
		new Response(JSON.stringify({ Error: { Code: '1', Message: 'Error' } }), { status })
	);

describe('FeatureFlagApi', () => {
	let api: FeatureFlagApi;

	beforeEach(() => {
		api = new FeatureFlagApi();
		mockFetch.mockReset();
	});

	describe('getFlags', () => {
		it('calls GET /api/FeatureFlag', async () => {
			mockFetch.mockReturnValueOnce(
				okJson({
					Content: { flags: { 'chat-suggestions': true } },
					Error: null,
					ServerStatus: 0,
				})
			);

			await api.getFlags();

			expect(mockFetch).toHaveBeenCalledOnce();
			const [url] = mockFetch.mock.calls[0];
			expect(url).toContain('api/FeatureFlag');
			expect(mockFetch.mock.calls[0][1].method).toBe('GET');
		});

		it('returns parsed flags from the response', async () => {
			const flags = { 'chat-suggestions': true, 'new-calendar-view': false };
			mockFetch.mockReturnValueOnce(
				okJson({ Content: { flags }, Error: null, ServerStatus: 0 })
			);

			const result = await api.getFlags();
			expect(result.Content.flags).toEqual(flags);
		});

		it('throws on non-200 response', async () => {
			mockFetch.mockReturnValueOnce(errorResponse(403));
			await expect(api.getFlags()).rejects.toBeDefined();
		});
	});

	describe('adminGetAllFlags', () => {
		it('calls GET /api/admin/FeatureFlag', async () => {
			mockFetch.mockReturnValueOnce(
				okJson({ Content: { flags: [] }, Error: null, ServerStatus: 0 })
			);

			await api.adminGetAllFlags();

			const [url] = mockFetch.mock.calls[0];
			expect(url).toContain('api/admin/FeatureFlag');
			expect(mockFetch.mock.calls[0][1].method).toBe('GET');
		});

		it('returns flag list from the response', async () => {
			const flags = [
				{ name: 'chat-suggestions', isEnabledGlobal: true, rolloutPercent: null },
			];
			mockFetch.mockReturnValueOnce(
				okJson({ Content: { flags }, Error: null, ServerStatus: 0 })
			);

			const result = await api.adminGetAllFlags();
			expect(result.Content.flags).toEqual(flags);
		});

		it('throws on non-200 response', async () => {
			mockFetch.mockReturnValueOnce(errorResponse(403));
			await expect(api.adminGetAllFlags()).rejects.toBeDefined();
		});
	});

	describe('adminUpdateFlag', () => {
		it('calls PUT /api/admin/FeatureFlag/{name}', async () => {
			mockFetch.mockReturnValueOnce(
				okJson({
					Content: {
						flag: {
							name: 'chat-suggestions',
							isEnabledGlobal: true,
							rolloutPercent: null,
						},
					},
					Error: null,
					ServerStatus: 0,
				})
			);

			await api.adminUpdateFlag('chat-suggestions', true, null);

			const [url, options] = mockFetch.mock.calls[0];
			expect(url).toContain('api/admin/FeatureFlag/chat-suggestions');
			expect(options.method).toBe('PUT');
			expect(JSON.parse(options.body)).toEqual({
				isEnabledGlobal: true,
				rolloutPercent: null,
			});
		});

		it('URL-encodes flag names with special characters', async () => {
			mockFetch.mockReturnValueOnce(
				okJson({
					Content: {
						flag: {
							name: 'flag/with/slashes',
							isEnabledGlobal: false,
							rolloutPercent: null,
						},
					},
					Error: null,
					ServerStatus: 0,
				})
			);

			await api.adminUpdateFlag('flag/with/slashes', false, null);

			const [url] = mockFetch.mock.calls[0];
			expect(url).toContain(encodeURIComponent('flag/with/slashes'));
		});

		it('sends rolloutPercent when provided', async () => {
			mockFetch.mockReturnValueOnce(
				okJson({
					Content: {
						flag: {
							name: 'chat-suggestions',
							isEnabledGlobal: true,
							rolloutPercent: 50,
						},
					},
					Error: null,
					ServerStatus: 0,
				})
			);

			await api.adminUpdateFlag('chat-suggestions', true, 50);

			const [, options] = mockFetch.mock.calls[0];
			expect(JSON.parse(options.body)).toEqual({ isEnabledGlobal: true, rolloutPercent: 50 });
		});

		it('throws on non-200 response', async () => {
			mockFetch.mockReturnValueOnce(errorResponse(403));
			await expect(api.adminUpdateFlag('chat-suggestions', true, null)).rejects.toBeDefined();
		});
	});
});
