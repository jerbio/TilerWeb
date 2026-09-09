import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CalendarEventApi } from '../calendarEventApi';
import ServerError from '@/core/error/server';
import { ApiResponse } from '@/core/common/types/api';
import { CalendarSearchEnvelope, CalendarSearchItem } from '@/core/common/types/schedule';

// Mock config to provide a base URL
vi.mock('@/config/config_getter', () => ({
	Env: {
		get: () => 'https://test.example.com/',
	},
}));

// Mock locationService (imported by AppApi) so module load is consistent
vi.mock('@/services/locationService', () => ({
	__esModule: true,
	default: {
		getCurrentLocation: vi.fn().mockResolvedValue({}),
	},
}));

// Spy on global fetch
const fetchSpy = vi.spyOn(globalThis, 'fetch');

const fullCapabilities = {
	canEdit: true,
	canDelete: true,
	canComplete: true,
	canSetAsNow: true,
};

const makeItem = (
	id: string,
	source: string,
	extra: Partial<CalendarSearchItem> = {}
): CalendarSearchItem => ({
	id,
	name: `item-${id}`,
	start: 1000,
	end: 2000,
	source,
	thirdPartyEventId: null,
	thirdPartyUserId: null,
	isReadOnly: false,
	capabilities: { ...fullCapabilities },
	...extra,
});

const envelope: CalendarSearchEnvelope = {
	items: [
		makeItem('e1', 'tiler'),
		makeItem('e2', 'google', { thirdPartyEventId: 'g-1', thirdPartyUserId: 'user@gmail.com' }),
	],
	sources: [
		{ source: 'tiler', status: 'success', queryMode: 'native-query' },
		{
			source: 'google',
			status: 'partial',
			queryMode: 'native-query',
			category: 'timeout',
			retryable: true,
			failureCount: 1,
		},
	],
	correlationId: 'corr-123',
};

const errorBody = {
	error: 'search_unavailable',
	message: 'Search is temporarily unavailable',
	category: 'authentication',
	correlationId: 'corr-123',
	sources: [{ provider: 'google', email: 'user@gmail.com', category: 'authentication' }],
};

const mockOkResponse = (): Response =>
	new Response(
		JSON.stringify({
			Error: { Code: '0', Message: 'OK' },
			Content: envelope,
			ServerStatus: null,
		}),
		{ status: 200, headers: { 'Content-Type': 'application/json' } }
	);

const requestedUrl = (): URL => {
	const [urlArg] = fetchSpy.mock.calls[0];
	const urlStr = typeof urlArg === 'string' ? urlArg : (urlArg as Request).url;
	return new URL(urlStr);
};

describe('CalendarEventApi.searchCalendarEvents', () => {
	let api: CalendarEventApi;

	beforeEach(() => {
		api = new CalendarEventApi();
		fetchSpy.mockReset();
	});

	it('sends GET to /api/CalendarEvent/Search with the query', async () => {
		fetchSpy.mockResolvedValueOnce(mockOkResponse());

		await api.searchCalendarEvents({ query: 'coffee' });

		expect(fetchSpy).toHaveBeenCalledOnce();
		const url = requestedUrl();
		expect(url.pathname).toContain('api/CalendarEvent/Search');
		expect(url.searchParams.get('query')).toBe('coffee');
		expect(url.searchParams.has('sources')).toBe(false);
	});

	it('comma-joins optional sources', async () => {
		fetchSpy.mockResolvedValueOnce(mockOkResponse());

		await api.searchCalendarEvents({ query: 'coffee', sources: ['tiler', 'google'] });

		expect(requestedUrl().searchParams.get('sources')).toBe('tiler,google');
	});

	it('passes the raw PostBack response through for service-layer handling', async () => {
		const resp: ApiResponse<CalendarSearchEnvelope> = {
			Error: { Code: '0', Message: 'OK' },
			Content: envelope,
			ServerStatus: null,
		};
		fetchSpy.mockResolvedValueOnce(
			new Response(JSON.stringify(resp), {
				status: 200,
				headers: { 'Content-Type': 'application/json' },
			})
		);

		const result = await api.searchCalendarEvents({ query: 'coffee' });

		expect(result.Content).toEqual(envelope);
		expect(result.Content.items).toHaveLength(2);
		expect(result.Content.correlationId).toBe('corr-123');
	});

	it('propagates a 502 as a ServerError carrying the typed body and status', async () => {
		fetchSpy.mockResolvedValueOnce(
			new Response(JSON.stringify(errorBody), {
				status: 502,
				headers: { 'Content-Type': 'application/json' },
			})
		);

		const p = api.searchCalendarEvents({ query: 'coffee' });
		const err = (await p.catch((e) => e)) as ServerError;

		expect(err).toBeInstanceOf(ServerError);
		expect(err.status).toBe(502);
		expect(err.details).toEqual(errorBody);
	});

	it('propagates a plain 404 (no body) as a ServerError with status 404', async () => {
		fetchSpy.mockResolvedValueOnce(
			new Response('', { status: 404, headers: { 'Content-Type': 'application/json' } })
		);

		const p = api.searchCalendarEvents({ query: 'coffee' });
		const err = (await p.catch((e) => e)) as ServerError;

		expect(err).toBeInstanceOf(ServerError);
		expect(err.status).toBe(404);
	});
});
