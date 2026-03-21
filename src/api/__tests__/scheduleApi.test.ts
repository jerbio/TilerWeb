import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ScheduleApi } from '../scheduleApi';
import {
	ScheduleShuffleParams,
	ScheduleReviseParams,
	ScheduleProcrastinateAllParams,
	ScheduleLookupResponse,
} from '@/core/common/types/schedule';

// Mock config to provide a base URL
vi.mock('@/config/config_getter', () => ({
	Env: {
		get: () => 'https://test.example.com/',
	},
}));

// Spy on global fetch
const fetchSpy = vi.spyOn(globalThis, 'fetch');

describe('ScheduleApi', () => {
	let api: ScheduleApi;

	const mockShuffleResponse: ScheduleLookupResponse = {
		Error: { Code: '0', Message: 'SUCCESS' },
		Content: {
			subCalendarEvents: [],
		},
		ServerStatus: null,
	};

	beforeEach(() => {
		api = new ScheduleApi();
		fetchSpy.mockReset();
	});

	describe('shuffle', () => {
		const shuffleParams: ScheduleShuffleParams = {
			UserLongitude: '-73.9857',
			UserLatitude: '40.7484',
			UserLocationVerified: 'true',
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
			UserLongitude: '-73.9857',
			UserLatitude: '40.7484',
			UserLocationVerified: 'true',
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
			UserLongitude: '-73.9857',
			UserLatitude: '40.7484',
			UserLocationVerified: 'true',
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
});
