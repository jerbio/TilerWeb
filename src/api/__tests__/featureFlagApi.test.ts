import { beforeEach, describe, expect, it, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/mocks/server';
import { FeatureFlagApi } from '@/api/featureFlagApi';

const envState = vi.hoisted(() => ({
	baseUrl: 'http://localhost',
}));

vi.mock('@/config/config_getter', () => ({
	Env: {
		get: () => envState.baseUrl,
		isDevelopment: () => false,
		isProduction: () => true,
	},
}));

const ok = (Content: unknown) => HttpResponse.json({ Content, Error: null, ServerStatus: 0 });
const forbidden = () =>
	HttpResponse.json(
		{ Content: null, Error: { Code: 'Forbidden', Message: 'Nope' }, ServerStatus: 1 },
		{ status: 403 }
	);

describe('FeatureFlagApi', () => {
	let api: FeatureFlagApi;

	beforeEach(() => {
		envState.baseUrl = 'http://localhost';
		api = new FeatureFlagApi();
	});

	describe('getFlags', () => {
		it('requests user flags from the feature flag endpoint', async () => {
			let request: Request | undefined;

			server.use(
				http.get('http://localhost/api/FeatureFlag', ({ request: req }) => {
					request = req;
					return ok({ flags: { 'chat-suggestions': true } });
				})
			);

			await api.getFlags();

			expect(request).toBeDefined();
			expect(request!.method).toBe('GET');
			expect(new URL(request!.url).pathname).toBe('/api/FeatureFlag');
		});

		it('returns the backend flag map unchanged', async () => {
			const flags = {
				'chat-suggestions': true,
				'new-calendar-view': false,
			};

			server.use(http.get('http://localhost/api/FeatureFlag', () => ok({ flags })));

			await expect(api.getFlags()).resolves.toMatchObject({
				Content: { flags },
				Error: null,
			});
		});

		it('uses the current BASE_URL value when the request is made', async () => {
			envState.baseUrl = 'http://feature-flags.test';
			let matched = false;

			server.use(
				http.get('http://feature-flags.test/api/FeatureFlag', () => {
					matched = true;
					return ok({ flags: {} });
				})
			);

			await api.getFlags();

			expect(matched).toBe(true);
		});

		it('throws the structured backend error for non-OK responses', async () => {
			server.use(http.get('http://localhost/api/FeatureFlag', forbidden));

			await expect(api.getFlags()).rejects.toMatchObject({
				Error: { Code: 'Forbidden', Message: 'Nope' },
			});
		});
	});

	describe('adminGetAllFlags', () => {
		it('requests the admin flag list from the admin endpoint', async () => {
			let request: Request | undefined;

			server.use(
				http.get('http://localhost/api/admin/FeatureFlag', ({ request: req }) => {
					request = req;
					return ok({ flags: [] });
				})
			);

			await api.adminGetAllFlags();

			expect(request).toBeDefined();
			expect(request!.method).toBe('GET');
			expect(new URL(request!.url).pathname).toBe('/api/admin/FeatureFlag');
		});

		it('returns admin flag metadata unchanged', async () => {
			const flags = [
				{ name: 'chat-suggestions', isEnabledGlobal: true, rolloutPercent: null },
				{ name: 'smart-scheduling', isEnabledGlobal: false, rolloutPercent: 25 },
			];

			server.use(http.get('http://localhost/api/admin/FeatureFlag', () => ok({ flags })));

			await expect(api.adminGetAllFlags()).resolves.toMatchObject({
				Content: { flags },
				Error: null,
			});
		});

		it('throws the structured backend error for non-OK responses', async () => {
			server.use(http.get('http://localhost/api/admin/FeatureFlag', forbidden));

			await expect(api.adminGetAllFlags()).rejects.toMatchObject({
				Error: { Code: 'Forbidden', Message: 'Nope' },
			});
		});
	});

	describe('adminUpdateFlag', () => {
		it('sends the flipped enabled value and rollout percent in the PUT body', async () => {
			let request: Request | undefined;
			let body: unknown;

			server.use(
				http.put(
					'http://localhost/api/admin/FeatureFlag/:name',
					async ({ request: req }) => {
						request = req;
						body = await req.json();
						return ok({
							flag: {
								name: 'chat-suggestions',
								isEnabledGlobal: true,
								rolloutPercent: 50,
							},
						});
					}
				)
			);

			await api.adminUpdateFlag('chat-suggestions', true, 50);

			expect(request).toBeDefined();
			expect(request!.method).toBe('PUT');
			expect(new URL(request!.url).pathname).toBe('/api/admin/FeatureFlag/chat-suggestions');
			expect(body).toEqual({ isEnabledGlobal: true, rolloutPercent: 50 });
		});

		it('keeps null rolloutPercent in the request body', async () => {
			let body: unknown;

			server.use(
				http.put('http://localhost/api/admin/FeatureFlag/:name', async ({ request }) => {
					body = await request.json();
					return ok({
						flag: {
							name: 'chat-suggestions',
							isEnabledGlobal: false,
							rolloutPercent: null,
						},
					});
				})
			);

			await api.adminUpdateFlag('chat-suggestions', false, null);

			expect(body).toEqual({ isEnabledGlobal: false, rolloutPercent: null });
		});

		it('URL-encodes flag names before sending the request', async () => {
			const flagName = 'flag/with/slashes';
			let requestUrl = '';

			server.use(
				http.put(
					`http://localhost/api/admin/FeatureFlag/${encodeURIComponent(flagName)}`,
					({ request }) => {
						requestUrl = request.url;
						return ok({
							flag: {
								name: flagName,
								isEnabledGlobal: true,
								rolloutPercent: null,
							},
						});
					}
				)
			);

			await api.adminUpdateFlag(flagName, true, null);

			expect(requestUrl).toContain('/api/admin/FeatureFlag/flag%2Fwith%2Fslashes');
		});

		it('throws the structured backend error for non-OK responses', async () => {
			server.use(http.put('http://localhost/api/admin/FeatureFlag/:name', forbidden));

			await expect(api.adminUpdateFlag('chat-suggestions', true, null)).rejects.toMatchObject(
				{
					Error: { Code: 'Forbidden', Message: 'Nope' },
				}
			);
		});
	});
});
