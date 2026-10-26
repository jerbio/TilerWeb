import { describe, it, expect, vi, beforeEach } from 'vitest';
import { IntegrationsApi } from '../integrationsApi';
import { integrationSuccessEnvelope } from '@/test/fixtures/integrationResponses';

// Mock config to provide a base URL
vi.mock('@/config/config_getter', () => ({
	Env: {
		get: () => 'https://test.example.com/',
	},
}));

// Spy on global fetch
const fetchSpy = vi.spyOn(globalThis, 'fetch');

const jsonResponse = (body: unknown): Response =>
	new Response(JSON.stringify(body), {
		status: 200,
		headers: { 'Content-Type': 'application/json' },
	});

/**
 * MSW (installed in the global test setup) intercepts fetch and records the
 * request as a single `Request` object rather than `(url, init)` arguments.
 * Normalize either shape to a `Request` so method/credentials assertions work.
 */
function toRequest(call: unknown[]): Request {
	const [urlArg, init] = call;
	return typeof urlArg === 'string'
		? new Request(urlArg, init as RequestInit)
		: (urlArg as Request);
}

describe('IntegrationsApi', () => {
	let api: IntegrationsApi;

	beforeEach(() => {
		api = new IntegrationsApi();
		fetchSpy.mockReset();
	});

	describe('getIntegrations', () => {
		it('sends a GET request to api/integrations without an integrationId param when omitted', async () => {
			fetchSpy.mockResolvedValueOnce(jsonResponse(integrationSuccessEnvelope));

			await api.getIntegrations();

			expect(fetchSpy).toHaveBeenCalledOnce();
			const [urlArg] = fetchSpy.mock.calls[0];
			const urlStr = typeof urlArg === 'string' ? urlArg : (urlArg as Request).url;

			expect(urlStr).toContain('api/integrations');
			expect(urlStr).not.toContain('integrationId');
			expect(toRequest(fetchSpy.mock.calls[0]).method).toBe('GET');
		});

		it('includes the integrationId query param only when provided', async () => {
			fetchSpy.mockResolvedValueOnce(jsonResponse(integrationSuccessEnvelope));
			const id = '9f86d081-884c-4baf-a5e2-4b9c6d1e7f21';

			await api.getIntegrations(id);

			const [urlArg] = fetchSpy.mock.calls[0];
			const urlStr = typeof urlArg === 'string' ? urlArg : (urlArg as Request).url;
			expect(urlStr).toContain(`integrationId=${id}`);
		});

		it('sends credentials: include so ASP.NET auth cookies are carried', async () => {
			fetchSpy.mockResolvedValueOnce(jsonResponse(integrationSuccessEnvelope));

			await api.getIntegrations();

			const request = toRequest(fetchSpy.mock.calls[0]);
			expect(request.credentials).toBe('include');
		});

		it('returns the raw envelope on success (mapping happens above the API layer)', async () => {
			fetchSpy.mockResolvedValueOnce(jsonResponse(integrationSuccessEnvelope));

			const result = await api.getIntegrations();

			expect(result).toEqual(integrationSuccessEnvelope);
		});

		it('rejects with the structured server error on an HTTP error with a JSON body', async () => {
			const errorBody = { Error: { Code: '500', Message: 'boom' } };
			fetchSpy.mockResolvedValueOnce(
				new Response(JSON.stringify(errorBody), {
					status: 500,
					headers: { 'Content-Type': 'application/json' },
				})
			);

			const promise = api.getIntegrations();
			await expect(promise).rejects.toEqual(errorBody);
		});

		it('rejects when the response body cannot be parsed as JSON', async () => {
			fetchSpy.mockResolvedValueOnce(
				new Response('not json', {
					status: 502,
					headers: { 'Content-Type': 'text/plain' },
				})
			);

			await expect(api.getIntegrations()).rejects.toThrow();
		});

		it('rejects on network error', async () => {
			fetchSpy.mockRejectedValueOnce(new Error('Network error'));

			await expect(api.getIntegrations()).rejects.toThrow();
		});
	});
});
