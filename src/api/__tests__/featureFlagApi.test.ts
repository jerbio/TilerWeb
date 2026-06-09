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
		it('GETs /api/FeatureFlag and returns the flag map unchanged', async () => {
			const flags = { 'chat-suggestions': true, 'new-calendar-view': false };
			let request: Request | undefined;

			server.use(
				http.get('http://localhost/api/FeatureFlag', ({ request: req }) => {
					request = req;
					return ok({ flags });
				})
			);

			await expect(api.getFlags()).resolves.toMatchObject({ Content: { flags } });
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

		it('uses the BASE_URL set at construction time when the request is made', async () => {
			envState.baseUrl = 'http://feature-flags.test';
			const freshApi = new FeatureFlagApi();
			let matched = false;

			server.use(
				http.get('http://feature-flags.test/api/FeatureFlag', () => {
					matched = true;
					return ok({ flags: {} });
				})
			);

			await freshApi.getFlags();

			expect(matched).toBe(true);
		});

		it('throws the structured backend error for non-OK responses', async () => {
			server.use(http.get('http://localhost/api/FeatureFlag', forbidden));
			await expect(api.getFlags()).rejects.toMatchObject({
				Error: { Code: 'Forbidden', Message: 'Nope' },
			});
		});
	});

	describe('selfToggle', () => {
		it('PUTs /api/FeatureFlag/{id}/self with {enabled} body', async () => {
			let request: Request | undefined;
			let body: unknown;

			server.use(
				http.put('http://localhost/api/FeatureFlag/:id/self', async ({ request: req }) => {
					request = req;
					body = await req.json();
					return ok({
						self_toggle: { flagId: 'flag-1', flag: 'chat', enabled: true },
					});
				})
			);

			await api.selfToggle('flag-1', true);

			expect(new URL(request!.url).pathname).toBe('/api/FeatureFlag/flag-1/self');
			expect(body).toEqual({ enabled: true });
		});
	});

	describe('adminGetAllFlags', () => {
		it('GETs /api/admin/FeatureFlag', async () => {
			let request: Request | undefined;
			server.use(
				http.get('http://localhost/api/admin/FeatureFlag', ({ request: req }) => {
					request = req;
					return ok({ flags: [] });
				})
			);

			await api.adminGetAllFlags();

			expect(request!.method).toBe('GET');
			expect(new URL(request!.url).pathname).toBe('/api/admin/FeatureFlag');
		});

		it('throws on non-OK responses', async () => {
			server.use(http.get('http://localhost/api/admin/FeatureFlag', forbidden));
			await expect(api.adminGetAllFlags()).rejects.toMatchObject({
				Error: { Code: 'Forbidden' },
			});
		});
	});

	describe('adminSearchUsers', () => {
		it('GETs /api/admin/users with search and take query params', async () => {
			let request: Request | undefined;
			server.use(
				http.get('http://localhost/api/admin/users', ({ request: req }) => {
					request = req;
					return ok({ users: [] });
				})
			);

			await api.adminSearchUsers('alice', 10);

			const url = new URL(request!.url);
			expect(url.pathname).toBe('/api/admin/users');
			expect(url.searchParams.get('search')).toBe('alice');
			expect(url.searchParams.get('take')).toBe('10');
		});
	});

	describe('adminGetFlagsForUser', () => {
		it('GETs /api/admin/FeatureFlag/users/{userId}', async () => {
			let request: Request | undefined;
			server.use(
				http.get(
					'http://localhost/api/admin/FeatureFlag/users/:userId',
					({ request: req }) => {
						request = req;
						return ok({ flagsForUser: { user: {}, flags: [] } });
					}
				)
			);

			await api.adminGetFlagsForUser('user-123');

			expect(new URL(request!.url).pathname).toBe('/api/admin/FeatureFlag/users/user-123');
		});
	});

	describe('adminSetOverride', () => {
		it('PUTs /api/admin/FeatureFlag/{flagId}/users/{userId} with isEnabled + expiresAtUtc', async () => {
			let request: Request | undefined;
			let body: unknown;

			server.use(
				http.put(
					'http://localhost/api/admin/FeatureFlag/:flagId/users/:userId',
					async ({ request: req }) => {
						request = req;
						body = await req.json();
						return ok({ override: {} });
					}
				)
			);

			await api.adminSetOverride('flag-1', 'user-2', true);

			expect(new URL(request!.url).pathname).toBe(
				'/api/admin/FeatureFlag/flag-1/users/user-2'
			);
			expect(request!.method).toBe('PUT');
			expect(body).toEqual({ isEnabled: true, expiresAtUtc: null });
		});

		it('URL-encodes path segments', async () => {
			let requestUrl = '';
			const flagId = 'flag/with/slashes';
			server.use(
				http.put(
					`http://localhost/api/admin/FeatureFlag/${encodeURIComponent(flagId)}/users/u`,
					({ request }) => {
						requestUrl = request.url;
						return ok({ override: {} });
					}
				)
			);

			await api.adminSetOverride(flagId, 'u', false);

			expect(requestUrl).toContain(encodeURIComponent(flagId));
		});
	});

	describe('adminClearOverride', () => {
		it('DELETEs /api/admin/FeatureFlag/{flagId}/users/{userId}', async () => {
			let request: Request | undefined;
			server.use(
				http.delete(
					'http://localhost/api/admin/FeatureFlag/:flagId/users/:userId',
					({ request: req }) => {
						request = req;
						return ok({ override: { cleared: true } });
					}
				)
			);

			await api.adminClearOverride('flag-1', 'user-2');

			expect(request!.method).toBe('DELETE');
			expect(new URL(request!.url).pathname).toBe(
				'/api/admin/FeatureFlag/flag-1/users/user-2'
			);
		});
	});
});
