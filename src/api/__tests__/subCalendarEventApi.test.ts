import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SubCalendarEventApi } from '../subCalendarEventApi';
import { ScheduleSubCalendarEvent, SubCalendarEventLookupResponse } from '@/core/common/types/schedule';

// Mock config to provide a base URL
vi.mock('@/config/config_getter', () => ({
	Env: {
		get: () => 'https://test.example.com/',
	},
}));

// Spy on global fetch
const fetchSpy = vi.spyOn(globalThis, 'fetch');

describe('SubCalendarEventApi', () => {
	let api: SubCalendarEventApi;

	const mockSubCalendarEvent: ScheduleSubCalendarEvent = {
		id: 'sub-event-123',
		start: 1769925600000,
		end: 1769929200000,
		isSleep: false,
		sleepDay: 0,
		isWake: false,
		wakeDay: 0,
		isPaused: false,
		isRigid: false,
		isComplete: false,
		isEnabled: true,
		isTardy: false,
		isViable: true,
		isScheduleAble: true,
		isProcrastinateEvent: false,
		travelTimeBefore: 0,
		travelTimeAfter: 0,
		travelTimeBeforeDetail: '',
		travelTimeAfterDetail: '',
		locationId: null,
		locationValidationId: '',
		isCompleteAfterElapsedEnabled: false,
		thirdPartyType: 'tiler',
		thirdPartyUserId: null,
		thirdPartyId: '',
		priority: 0,
		tileShareDesignatedId: null,
		projectionType: ['SimpleObject'],
		name: 'Test Event',
		address: '',
		addressDescription: '',
		location: {
			id: '',
			description: '',
			address: '',
			longitude: 0,
			latitude: 0,
			isVerified: false,
			isDefault: false,
			isNull: true,
			thirdPartyId: '',
			userId: '',
			source: '',
			nickname: '',
		},
		description: '',
		searchdDescription: '',
		rangeStart: 1769925600000,
		rangeEnd: 1770532200000,
		colorOpacity: 1,
		colorRed: 100,
		colorGreen: 150,
		colorBlue: 200,
		isRecurring: false,
		emojis: null,
		isReadOnly: false,
		restrictionProfile: null,
		isWhatIf: false,
		jsonProjectionType: 'SimpleObject',
		blob: { type: 0, note: '', id: '' },
		styleProperties: {
			id: '',
			color: { colorSelection: 0, r: 100, g: 150, b: 200, o: 1 },
		},
		split: 1,
		calendarEventStart: 1769925600000,
		calendarEventEnd: 1770532200000,
		SubCalCalEventStart: 1769925600000,
		SubCalCalEventEnd: 1769929200000,
		travelDetail: { before: null, after: null },
	};

	const mockResponse: SubCalendarEventLookupResponse = {
		Error: { Code: '0', Message: 'SUCCESS' },
		Content: mockSubCalendarEvent,
		ServerStatus: null,
	};

	beforeEach(() => {
		api = new SubCalendarEventApi();
		fetchSpy.mockReset();
	});

	describe('getSubCalendarEvent', () => {
		it('sends GET request to /api/SubCalendarEvent with EventID query param', async () => {
			fetchSpy.mockResolvedValueOnce(
				new Response(JSON.stringify(mockResponse), {
					status: 200,
					headers: { 'Content-Type': 'application/json' },
				}),
			);

			await api.getSubCalendarEvent('sub-event-123');

			expect(fetchSpy).toHaveBeenCalledOnce();
			const [urlArg] = fetchSpy.mock.calls[0];
			const urlStr = typeof urlArg === 'string' ? urlArg : (urlArg as Request).url;

			expect(urlStr).toContain('api/SubCalendarEvent');
			expect(urlStr).toContain('EventID=sub-event-123');
		});

		it('returns parsed response on success', async () => {
			fetchSpy.mockResolvedValueOnce(
				new Response(JSON.stringify(mockResponse), {
					status: 200,
					headers: { 'Content-Type': 'application/json' },
				}),
			);

			const result = await api.getSubCalendarEvent('sub-event-123');

			expect(result.Content.id).toBe('sub-event-123');
			expect(result.Content.name).toBe('Test Event');
		});

		it('throws on HTTP error', async () => {
			fetchSpy.mockResolvedValueOnce(
				new Response(JSON.stringify({ Error: { Code: '500', Message: 'Server error' } }), {
					status: 500,
					headers: { 'Content-Type': 'application/json' },
				}),
			);

			await expect(api.getSubCalendarEvent('bad-id')).rejects.toThrow();
		});
	});

	describe('updateSubCalendarEvent', () => {
		it('sends POST request to /api/SubCalendarEvent with payload in body', async () => {
			fetchSpy.mockResolvedValueOnce(
				new Response(JSON.stringify(mockResponse), {
					status: 200,
					headers: { 'Content-Type': 'application/json' },
				}),
			);

			await api.updateSubCalendarEvent({
				Id: 'sub-event-123',
				SubCalendarEventStart: 1769930000000,
				SubCalendarEventEnd: 1769933600000,
				TimeZone: 'America/New_York',
			});

			expect(fetchSpy).toHaveBeenCalledOnce();
			const callArgs = fetchSpy.mock.calls[0];
			const request = callArgs[0] instanceof Request
				? callArgs[0]
				: new Request(callArgs[0] as string, callArgs[1] as RequestInit);

			expect(request.url).toContain('api/SubCalendarEvent');
			expect(request.method).toBe('POST');
			const body = await request.json();
			expect(body).toEqual({
				Id: 'sub-event-123',
				SubCalendarEventStart: 1769930000000,
				SubCalendarEventEnd: 1769933600000,
				TimeZone: 'America/New_York',
			});
		});

		it('includes CalendarEventEnd when provided', async () => {
			fetchSpy.mockResolvedValueOnce(
				new Response(JSON.stringify(mockResponse), {
					status: 200,
					headers: { 'Content-Type': 'application/json' },
				}),
			);

			await api.updateSubCalendarEvent({
				Id: 'sub-event-123',
				SubCalendarEventStart: 1769930000000,
				SubCalendarEventEnd: 1769933600000,
				CalendarEventEnd: 1770600000000,
				TimeZone: 'America/New_York',
			});

			const callArgs = fetchSpy.mock.calls[0];
			const request = callArgs[0] instanceof Request
				? callArgs[0]
				: new Request(callArgs[0] as string, callArgs[1] as RequestInit);

			const body = await request.json();
			expect(body.CalendarEventEnd).toBe(1770600000000);
		});

		it('returns parsed response on success', async () => {
			fetchSpy.mockResolvedValueOnce(
				new Response(JSON.stringify(mockResponse), {
					status: 200,
					headers: { 'Content-Type': 'application/json' },
				}),
			);

			const result = await api.updateSubCalendarEvent({
				Id: 'sub-event-123',
				SubCalendarEventStart: 1769930000000,
				TimeZone: 'America/New_York',
			});

			expect(result.Content.id).toBe('sub-event-123');
			expect(result.Content.name).toBe('Test Event');
		});

		it('throws on HTTP error', async () => {
			fetchSpy.mockResolvedValueOnce(
				new Response(JSON.stringify({ Error: { Code: '500', Message: 'Server error' } }), {
					status: 500,
					headers: { 'Content-Type': 'application/json' },
				}),
			);

			await expect(
				api.updateSubCalendarEvent({
					Id: 'bad-id',
					SubCalendarEventStart: 1769930000000,
					TimeZone: 'America/New_York',
				}),
			).rejects.toThrow();
		});

		it('handles partial updates with only start time', async () => {
			fetchSpy.mockResolvedValueOnce(
				new Response(JSON.stringify(mockResponse), {
					status: 200,
					headers: { 'Content-Type': 'application/json' },
				}),
			);

			await api.updateSubCalendarEvent({
				Id: 'sub-event-123',
				SubCalendarEventStart: 1769930000000,
				TimeZone: 'UTC',
			});

			const callArgs = fetchSpy.mock.calls[0];
			const request = callArgs[0] instanceof Request
				? callArgs[0]
				: new Request(callArgs[0] as string, callArgs[1] as RequestInit);

			const body = await request.json();
			expect(body.Id).toBe('sub-event-123');
			expect(body.SubCalendarEventStart).toBe(1769930000000);
			expect(body.SubCalendarEventEnd).toBeUndefined();
		});
	});
});
