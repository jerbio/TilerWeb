import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ScheduleApi } from '../scheduleApi';
import {
	ScheduleShuffleParams,
	ScheduleReviseParams,
	ScheduleProcrastinateAllParams,
	ScheduleProcrastinateEventParams,
	ScheduleLookupResponse,
} from '@/core/common/types/schedule';

// Mock config to provide a base URL
vi.mock('@/config/config_getter', () => ({
	Env: {
		get: () => 'https://test.example.com/',
	},
}));

// Mock locationService so scheduleRequest's getLocationData() resolves consistently
const mockLocation = vi.hoisted(() => ({
	location: 'Empire State Building, New York, NY',
	longitude: -73.9857,
	latitude: 40.7484,
	verified: true,
}));

// Mock locationService so scheduleRequest's getLocationData() resolves consistently
vi.mock('@/services/locationService', () => ({
	__esModule: true,
	default: {
		getCurrentLocation: vi.fn().mockResolvedValue(mockLocation),
	},
}));

// Spy on global fetch
const fetchSpy = vi.spyOn(globalThis, 'fetch');

describe('ScheduleApi', () => {
	let api: ScheduleApi;
	let _origResolvedOptions: Intl.DateTimeFormat['resolvedOptions'];

	const mockShuffleResponse: ScheduleLookupResponse = {
		Error: { Code: '0', Message: 'SUCCESS' },
		Content: {
			subCalendarEvents: [],
		},
		ServerStatus: null,
	};

	beforeEach(() => {
		// Override Intl timezone so TimeZone assertions are deterministic across machines
		_origResolvedOptions = Intl.DateTimeFormat.prototype.resolvedOptions;
		Intl.DateTimeFormat.prototype.resolvedOptions = function () {
			return { timeZone: 'UTC' } as unknown as Intl.ResolvedDateTimeFormatOptions;
		};
		api = new ScheduleApi();
		fetchSpy.mockReset();
	});

	afterEach(() => {
		Intl.DateTimeFormat.prototype.resolvedOptions = _origResolvedOptions;
	});

	describe('lookup ranges', () => {
		it.each(['user', 'schedule'] as const)(
			'sends the explicit range and device timezone when looking up by %s',
			async (kind) => {
				fetchSpy.mockResolvedValueOnce(
					new Response(JSON.stringify(mockShuffleResponse), { status: 200 })
				);
				const range = { startRange: 1793253600000, endRange: 1794207600000 };
				if (kind === 'user') await api.lookupScheduleByUserId('user-1', range);
				else await api.lookupScheduleById('schedule-1', range);
				const input = fetchSpy.mock.calls[0][0];
				const url = new URL(input instanceof Request ? input.url : String(input));
				expect(url.pathname).toBe('/api/Schedule/Lookup');
				expect(url.searchParams.get('startRange')).toBe(String(range.startRange));
				expect(url.searchParams.get('endRange')).toBe(String(range.endRange));
				expect(url.searchParams.get('TimeZone')).toBe('UTC');
				expect(url.searchParams.get('mobileApp')).toBe('true');
				expect(url.searchParams.get(kind === 'user' ? 'lookupUserId' : 'scheduleId')).toBe(
					`${kind}-1`
				);
			}
		);
	});

	describe('shuffle', () => {
		const shuffleParams: ScheduleShuffleParams = {
			UserLongitude: String(mockLocation.longitude),
			UserLatitude: String(mockLocation.latitude),
			UserLocationVerified: String(mockLocation.verified),
			MobileApp: true,
			SocketId: true,
			TimeZoneOffset: 0,
			Version: 'v2',
			TimeZone: 'America/New_York',
			IsTimeZoneAdjusted: 'true',
		};

		it('sends POST to api/Schedule/Shuffle with correct body', async () => {
			fetchSpy.mockResolvedValueOnce(
				new Response(JSON.stringify(mockShuffleResponse), { status: 200 })
			);

			await api.shuffle(shuffleParams);

			expect(fetchSpy).toHaveBeenCalledTimes(1);
			const callArgs = fetchSpy.mock.calls[0];
			const request =
				callArgs[0] instanceof Request
					? callArgs[0]
					: new Request(callArgs[0] as string, callArgs[1] as RequestInit);

			expect(request.url).toContain('api/Schedule/Shuffle');
			expect(request.method).toBe('POST');
			const body = await request.json();
			expect(body).toEqual(shuffleParams);
		});

		it('returns ScheduleLookupResponse on success', async () => {
			fetchSpy.mockResolvedValueOnce(
				new Response(JSON.stringify(mockShuffleResponse), { status: 200 })
			);

			const result = await api.shuffle(shuffleParams);

			expect(result).toEqual(mockShuffleResponse);
			expect(result.Content.subCalendarEvents).toEqual([]);
		});

		it('throws on HTTP error', async () => {
			fetchSpy.mockResolvedValueOnce(
				new Response(
					JSON.stringify({ Error: { Code: '500', Message: 'Internal Server Error' } }),
					{ status: 500 }
				)
			);

			await expect(api.shuffle(shuffleParams)).rejects.toThrow();
		});
	});

	describe('revise', () => {
		const reviseParams: ScheduleReviseParams = {
			UserLongitude: String(mockLocation.longitude),
			UserLatitude: String(mockLocation.latitude),
			UserLocationVerified: String(mockLocation.verified),
			MobileApp: true,
			SocketId: true,
			TimeZoneOffset: 0,
			Version: 'v2',
			TimeZone: 'America/New_York',
			IsTimeZoneAdjusted: 'true',
		};

		it('sends POST to api/Schedule/Revise with correct body', async () => {
			fetchSpy.mockResolvedValueOnce(
				new Response(JSON.stringify(mockShuffleResponse), { status: 200 })
			);

			await api.revise(reviseParams);

			expect(fetchSpy).toHaveBeenCalledTimes(1);
			const callArgs = fetchSpy.mock.calls[0];
			const request =
				callArgs[0] instanceof Request
					? callArgs[0]
					: new Request(callArgs[0] as string, callArgs[1] as RequestInit);

			expect(request.url).toContain('api/Schedule/Revise');
			expect(request.method).toBe('POST');
			const body = await request.json();
			expect(body).toEqual(reviseParams);
		});

		it('returns ScheduleLookupResponse on success', async () => {
			fetchSpy.mockResolvedValueOnce(
				new Response(JSON.stringify(mockShuffleResponse), { status: 200 })
			);

			const result = await api.revise(reviseParams);

			expect(result).toEqual(mockShuffleResponse);
			expect(result.Content.subCalendarEvents).toEqual([]);
		});

		it('throws on HTTP error', async () => {
			fetchSpy.mockResolvedValueOnce(
				new Response(
					JSON.stringify({ Error: { Code: '500', Message: 'Internal Server Error' } }),
					{ status: 500 }
				)
			);

			await expect(api.revise(reviseParams)).rejects.toThrow();
		});
	});

	describe('procrastinateAll', () => {
		const procrastinateAllParams: ScheduleProcrastinateAllParams = {
			UserLongitude: String(mockLocation.longitude),
			UserLatitude: String(mockLocation.latitude),
			UserLocationVerified: String(mockLocation.verified),
			Version: 'v2',
			TimeZone: 'America/New_York',
			DurationDays: 0,
			DurationHours: 0,
			DurationMins: 0,
			DurationInMs: 0,
		};

		it('sends POST to api/Schedule/ProcrastinateAll with correct body', async () => {
			fetchSpy.mockResolvedValueOnce(
				new Response(JSON.stringify(mockShuffleResponse), { status: 200 })
			);

			await api.procrastinateAll(procrastinateAllParams);

			expect(fetchSpy).toHaveBeenCalledTimes(1);
			const callArgs = fetchSpy.mock.calls[0];
			const request =
				callArgs[0] instanceof Request
					? callArgs[0]
					: new Request(callArgs[0] as string, callArgs[1] as RequestInit);

			expect(request.url).toContain('api/Schedule/ProcrastinateAll');
			expect(request.method).toBe('POST');
			const body = await request.json();
			expect(body).toEqual(procrastinateAllParams);
		});

		it('returns ScheduleLookupResponse on success', async () => {
			fetchSpy.mockResolvedValueOnce(
				new Response(JSON.stringify(mockShuffleResponse), { status: 200 })
			);

			const result = await api.procrastinateAll(procrastinateAllParams);

			expect(result).toEqual(mockShuffleResponse);
			expect(result.Content.subCalendarEvents).toEqual([]);
		});

		it('throws on HTTP error', async () => {
			fetchSpy.mockResolvedValueOnce(
				new Response(
					JSON.stringify({ Error: { Code: '500', Message: 'Internal Server Error' } }),
					{ status: 500 }
				)
			);

			await expect(api.procrastinateAll(procrastinateAllParams)).rejects.toThrow();
		});
	});

	describe('completeEvent', () => {
		const eventId = 'event-id-123';

		it('sends POST to api/Schedule/Event/Complete with correct body', async () => {
			fetchSpy.mockResolvedValueOnce(
				new Response(JSON.stringify(mockShuffleResponse), { status: 200 })
			);

			await api.completeEvent(eventId);

			expect(fetchSpy).toHaveBeenCalledTimes(1);
			const callArgs = fetchSpy.mock.calls[0];
			const request =
				callArgs[0] instanceof Request
					? callArgs[0]
					: new Request(callArgs[0] as string, callArgs[1] as RequestInit);

			expect(request.url).toContain('api/Schedule/Event/Complete');
			expect(request.method).toBe('POST');
			const body = await request.json();
			expect(body).toEqual({
				EventID: eventId,
				Version: 'v2',
				TimeZone: 'UTC',
				UserLongitude: String(mockLocation.longitude),
				UserLatitude: String(mockLocation.latitude),
				UserLocationVerified: String(mockLocation.verified),
			});
		});

		it('returns ScheduleLookupResponse on success', async () => {
			fetchSpy.mockResolvedValueOnce(
				new Response(JSON.stringify(mockShuffleResponse), { status: 200 })
			);

			const result = await api.completeEvent(eventId);

			expect(result).toEqual(mockShuffleResponse);
		});

		it('throws on HTTP error', async () => {
			fetchSpy.mockResolvedValueOnce(
				new Response(
					JSON.stringify({ Error: { Code: '500', Message: 'Internal Server Error' } }),
					{ status: 500 }
				)
			);

			await expect(api.completeEvent(eventId)).rejects.toThrow();
		});
	});

	describe('setEventAsNow', () => {
		const eventId = 'event-id-123';

		it('sends POST to api/Schedule/Event/Now with correct body', async () => {
			fetchSpy.mockResolvedValueOnce(
				new Response(JSON.stringify(mockShuffleResponse), { status: 200 })
			);

			await api.setEventAsNow(eventId);

			expect(fetchSpy).toHaveBeenCalledTimes(1);
			const callArgs = fetchSpy.mock.calls[0];
			const request =
				callArgs[0] instanceof Request
					? callArgs[0]
					: new Request(callArgs[0] as string, callArgs[1] as RequestInit);

			expect(request.url).toContain('api/Schedule/Event/Now');
			expect(request.method).toBe('POST');
			const body = await request.json();
			expect(body).toEqual({
				EventID: eventId,
				Version: 'v2',
				TimeZone: 'UTC',
				UserLongitude: String(mockLocation.longitude),
				UserLatitude: String(mockLocation.latitude),
				UserLocationVerified: String(mockLocation.verified),
			});
		});

		it('returns ScheduleLookupResponse on success', async () => {
			fetchSpy.mockResolvedValueOnce(
				new Response(JSON.stringify(mockShuffleResponse), { status: 200 })
			);

			const result = await api.setEventAsNow(eventId);

			expect(result).toEqual(mockShuffleResponse);
		});

		it('throws on HTTP error', async () => {
			fetchSpy.mockResolvedValueOnce(
				new Response(
					JSON.stringify({ Error: { Code: '500', Message: 'Internal Server Error' } }),
					{ status: 500 }
				)
			);

			await expect(api.setEventAsNow(eventId)).rejects.toThrow();
		});
	});

	describe('procrastinateEvent', () => {
		const procrastinateParams: ScheduleProcrastinateEventParams = {
			EventID: 'event-id-123',
			DurationDays: 1,
			DurationHours: 2,
			DurationMins: 30,
			DurationInMs: 95400000,
		};

		it('sends POST to api/Schedule/Event/Procrastinate with correct body', async () => {
			fetchSpy.mockResolvedValueOnce(
				new Response(JSON.stringify(mockShuffleResponse), { status: 200 })
			);

			await api.procrastinateEvent(procrastinateParams);

			expect(fetchSpy).toHaveBeenCalledTimes(1);
			const callArgs = fetchSpy.mock.calls[0];
			const request =
				callArgs[0] instanceof Request
					? callArgs[0]
					: new Request(callArgs[0] as string, callArgs[1] as RequestInit);

			expect(request.url).toContain('api/Schedule/Event/Procrastinate');
			expect(request.method).toBe('POST');
			const body = await request.json();
			expect(body).toEqual({
				...procrastinateParams,
				Version: 'v2',
				TimeZone: 'UTC',
				UserLongitude: String(mockLocation.longitude),
				UserLatitude: String(mockLocation.latitude),
				UserLocationVerified: String(mockLocation.verified),
			});
		});

		it('uses provided Version when specified', async () => {
			fetchSpy.mockResolvedValueOnce(
				new Response(JSON.stringify(mockShuffleResponse), { status: 200 })
			);

			const paramsWithVersion = { ...procrastinateParams, Version: 'v3' };
			await api.procrastinateEvent(paramsWithVersion);

			const callArgs = fetchSpy.mock.calls[0];
			const request =
				callArgs[0] instanceof Request
					? callArgs[0]
					: new Request(callArgs[0] as string, callArgs[1] as RequestInit);
			const body = await request.json();
			expect(body.Version).toBe('v3');
		});

		it('returns ScheduleLookupResponse on success', async () => {
			fetchSpy.mockResolvedValueOnce(
				new Response(JSON.stringify(mockShuffleResponse), { status: 200 })
			);

			const result = await api.procrastinateEvent(procrastinateParams);

			expect(result).toEqual(mockShuffleResponse);
		});

		it('throws on HTTP error', async () => {
			fetchSpy.mockResolvedValueOnce(
				new Response(
					JSON.stringify({ Error: { Code: '500', Message: 'Internal Server Error' } }),
					{ status: 500 }
				)
			);

			await expect(api.procrastinateEvent(procrastinateParams)).rejects.toThrow();
		});
	});
});
