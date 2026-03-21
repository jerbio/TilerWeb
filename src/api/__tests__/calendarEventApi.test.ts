import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CalendarEventApi } from '../calendarEventApi';
import {
	CalendarEvent,
	CalendarEventResponse,
	CalendarEventSearchResponse,
} from '@/core/common/types/schedule';

// Mock config to provide a base URL
vi.mock('@/config/config_getter', () => ({
	Env: {
		get: () => 'https://test.example.com/',
	},
}));

// Spy on global fetch
const fetchSpy = vi.spyOn(globalThis, 'fetch');

describe('CalendarEventApi', () => {
	let api: CalendarEventApi;

	const mockSearchResults: CalendarEventSearchResponse = {
		Error: { Code: '0', Message: 'SUCCESS' },
		Content: [
			{
				id: '30d305cd-18ee-4c0e-bba0-9e5a6dfab2ed_7_0_0',
				start: 1769925600000,
				end: 1770532200000,
				name: 'work out',
				address: '',
				addressDescription: '',
				searchdDescription: '',
				splitCount: 4,
				completeCount: 0,
				deletionCount: 0,
				thirdpartyType: 'tiler',
				thirdPartyId: null,
				thirdPartyUserId: null,
				colorOpacity: null,
				colorRed: null,
				colorGreen: null,
				colorBlue: null,
				isComplete: false,
				isEnabled: true,
				isRecurring: true,
				locationId: '7147101b-b226-4bf0-95f5-b9a6959c4689',
				isReadOnly: false,
				isProcrastinateEvent: false,
				isRigid: false,
				uiConfig: {
					id: '9dc0da1f-f7f9-42db-aefd-f491352d0c64',
				} as CalendarEvent['uiConfig'],
				repetition: null,
				eachTileDuration: 5400000,
				restrictionProfile: null,
				emojis: null,
				isWhatIf: false,
				entityName: 'CalendarEvent',
				blob: { type: 0, note: '', id: 'bb6b9d9e-1a33-4173-93a9-1f64cc7879e9' },
				subEvents: null,
			},
		],
		ServerStatus: null,
	};

	beforeEach(() => {
		api = new CalendarEventApi();
		fetchSpy.mockReset();
	});

	describe('searchByName', () => {
		it('sends GET request to /api/CalendarEvent/Name with correct query params', async () => {
			fetchSpy.mockResolvedValueOnce(
				new Response(JSON.stringify(mockSearchResults), {
					status: 200,
					headers: { 'Content-Type': 'application/json' },
				})
			);

			await api.searchByName({
				data: 'drinks',
				userName: 'ashtondemo',
				userId: 'ee1d526c-6426-46c1-903f-bfa27d578c6d',
			});

			expect(fetchSpy).toHaveBeenCalledOnce();
			const [urlArg] = fetchSpy.mock.calls[0];
			// fetch may receive a string or Request object depending on MSW interception
			const urlStr = typeof urlArg === 'string' ? urlArg : (urlArg as Request).url;

			expect(urlStr).toContain('api/CalendarEvent/Name');
			expect(urlStr).toContain('Data=drinks');
			expect(urlStr).toContain('UserName=ashtondemo');
			expect(urlStr).toContain('UserID=ee1d526c-6426-46c1-903f-bfa27d578c6d');
		});

		it('returns parsed response on success', async () => {
			fetchSpy.mockResolvedValueOnce(
				new Response(JSON.stringify(mockSearchResults), {
					status: 200,
					headers: { 'Content-Type': 'application/json' },
				})
			);

			const result = await api.searchByName({
				data: 'drinks',
				userName: 'ashtondemo',
				userId: 'ee1d526c-6426-46c1-903f-bfa27d578c6d',
			});

			expect(result.Content).toHaveLength(1);
			expect(result.Content[0].name).toBe('work out');
		});

		it('sends batchSize and index query params when provided', async () => {
			fetchSpy.mockResolvedValueOnce(
				new Response(JSON.stringify(mockSearchResults), {
					status: 200,
					headers: { 'Content-Type': 'application/json' },
				})
			);

			await api.searchByName({
				data: 'work out',
				userName: 'ashtondemo',
				userId: 'ee1d526c-6426-46c1-903f-bfa27d578c6d',
				batchSize: 10,
				index: 2,
			});

			const [urlArg] = fetchSpy.mock.calls[0];
			const urlStr = typeof urlArg === 'string' ? urlArg : (urlArg as Request).url;

			expect(urlStr).toContain('batchSize=10');
			expect(urlStr).toContain('index=2');
		});

		it('omits batchSize and index when not provided', async () => {
			fetchSpy.mockResolvedValueOnce(
				new Response(JSON.stringify(mockSearchResults), {
					status: 200,
					headers: { 'Content-Type': 'application/json' },
				})
			);

			await api.searchByName({
				data: 'work out',
				userName: 'ashtondemo',
				userId: 'ee1d526c-6426-46c1-903f-bfa27d578c6d',
			});

			const [urlArg] = fetchSpy.mock.calls[0];
			const urlStr = typeof urlArg === 'string' ? urlArg : (urlArg as Request).url;

			expect(urlStr).not.toContain('batchSize');
			expect(urlStr).not.toContain('index');
		});

		it('throws on HTTP error', async () => {
			fetchSpy.mockResolvedValueOnce(
				new Response(JSON.stringify({ Error: { Code: '500', Message: 'Server error' } }), {
					status: 500,
					headers: { 'Content-Type': 'application/json' },
				})
			);

			await expect(
				api.searchByName({
					data: 'bad-query',
					userName: 'ashtondemo',
					userId: 'ee1d526c-6426-46c1-903f-bfa27d578c6d',
				})
			).rejects.toThrow();
		});
	});

	describe('setAsNow', () => {
		const mockResponse: CalendarEventResponse = {
			Error: { Code: '0', Message: 'SUCCESS' },
			Content: mockSearchResults.Content[0],
			ServerStatus: null,
		};

		it('sends POST request to /api/CalendarEvent/Now with ID in body', async () => {
			fetchSpy.mockResolvedValueOnce(
				new Response(JSON.stringify(mockResponse), {
					status: 200,
					headers: { 'Content-Type': 'application/json' },
				})
			);

			await api.setAsNow('event-id-123');

			expect(fetchSpy).toHaveBeenCalledOnce();
			const callArgs = fetchSpy.mock.calls[0];
			const request =
				callArgs[0] instanceof Request
					? callArgs[0]
					: new Request(callArgs[0] as string, callArgs[1] as RequestInit);

			expect(request.url).toContain('api/CalendarEvent/Now');
			expect(request.method).toBe('POST');
			const body = await request.json();
			expect(body).toEqual({ ID: 'event-id-123' });
		});

		it('returns parsed response on success', async () => {
			fetchSpy.mockResolvedValueOnce(
				new Response(JSON.stringify(mockResponse), {
					status: 200,
					headers: { 'Content-Type': 'application/json' },
				})
			);

			const result = await api.setAsNow('event-id-123');

			expect(result.Content.name).toBe('work out');
		});

		it('throws on HTTP error', async () => {
			fetchSpy.mockResolvedValueOnce(
				new Response(JSON.stringify({ Error: { Code: '500', Message: 'Server error' } }), {
					status: 500,
					headers: { 'Content-Type': 'application/json' },
				})
			);

			await expect(api.setAsNow('bad-id')).rejects.toThrow();
		});
	});

	describe('markAsComplete', () => {
		const mockResponse: CalendarEventResponse = {
			Error: { Code: '0', Message: 'SUCCESS' },
			Content: mockSearchResults.Content[0],
			ServerStatus: null,
		};

		it('sends POST request to /api/CalendarEvent/Complete with EventID in body', async () => {
			fetchSpy.mockResolvedValueOnce(
				new Response(JSON.stringify(mockResponse), {
					status: 200,
					headers: { 'Content-Type': 'application/json' },
				})
			);

			await api.markAsComplete('event-id-456');

			expect(fetchSpy).toHaveBeenCalledOnce();
			const callArgs = fetchSpy.mock.calls[0];
			const request =
				callArgs[0] instanceof Request
					? callArgs[0]
					: new Request(callArgs[0] as string, callArgs[1] as RequestInit);

			expect(request.url).toContain('api/CalendarEvent/Complete');
			expect(request.method).toBe('POST');
			const body = await request.json();
			expect(body).toEqual({ EventID: 'event-id-456' });
		});

		it('returns parsed response on success', async () => {
			fetchSpy.mockResolvedValueOnce(
				new Response(JSON.stringify(mockResponse), {
					status: 200,
					headers: { 'Content-Type': 'application/json' },
				})
			);

			const result = await api.markAsComplete('event-id-456');

			expect(result.Content.name).toBe('work out');
		});

		it('throws on HTTP error', async () => {
			fetchSpy.mockResolvedValueOnce(
				new Response(JSON.stringify({ Error: { Code: '500', Message: 'Server error' } }), {
					status: 500,
					headers: { 'Content-Type': 'application/json' },
				})
			);

			await expect(api.markAsComplete('bad-id')).rejects.toThrow();
		});
	});

	describe('deleteCalendarEvent', () => {
		const mockResponse: CalendarEventResponse = {
			Error: { Code: '0', Message: 'SUCCESS' },
			Content: mockSearchResults.Content[0],
			ServerStatus: null,
		};

		it('sends DELETE request to /api/CalendarEvent with EventID in body', async () => {
			fetchSpy.mockResolvedValueOnce(
				new Response(JSON.stringify(mockResponse), {
					status: 200,
					headers: { 'Content-Type': 'application/json' },
				})
			);

			await api.deleteCalendarEvent('event-id-789');

			expect(fetchSpy).toHaveBeenCalledOnce();
			const callArgs = fetchSpy.mock.calls[0];
			const request =
				callArgs[0] instanceof Request
					? callArgs[0]
					: new Request(callArgs[0] as string, callArgs[1] as RequestInit);

			expect(request.url).toContain('api/CalendarEvent');
			expect(request.url).not.toContain('api/CalendarEvent/');
			expect(request.method).toBe('DELETE');
			const body = await request.json();
			expect(body).toEqual({ EventID: 'event-id-789' });
		});

		it('returns parsed response on success', async () => {
			fetchSpy.mockResolvedValueOnce(
				new Response(JSON.stringify(mockResponse), {
					status: 200,
					headers: { 'Content-Type': 'application/json' },
				})
			);

			const result = await api.deleteCalendarEvent('event-id-789');

			expect(result.Content.name).toBe('work out');
		});

		it('throws on HTTP error', async () => {
			fetchSpy.mockResolvedValueOnce(
				new Response(JSON.stringify({ Error: { Code: '500', Message: 'Server error' } }), {
					status: 500,
					headers: { 'Content-Type': 'application/json' },
				})
			);

			await expect(api.deleteCalendarEvent('bad-id')).rejects.toThrow();
		});
	});
});
