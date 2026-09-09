import { describe, it, expect, vi, beforeEach } from 'vitest';
import ScheduleService from '../scheduleService';
import { ScheduleApi } from '@/api/scheduleApi';
import { SubCalendarEventApi } from '@/api/subCalendarEventApi';
import { CalendarEventApi } from '@/api/calendarEventApi';
import { LocationApi } from '@/api/locationApi';
import ServerError from '@/core/error/server';
import { CalendarSearchUnavailableError } from '@/core/common/types/errors';
import { ApiResponse } from '@/core/common/types/api';
import { CalendarSearchEnvelope } from '@/core/common/types/schedule';

// Mock the API classes
vi.mock('@/api/scheduleApi');
vi.mock('@/api/subCalendarEventApi');
vi.mock('@/api/calendarEventApi');
vi.mock('@/api/locationApi');
vi.mock('@/config/config_getter', () => ({
	Env: { get: () => 'https://test.example.com/' },
}));

describe('ScheduleService.searchCalendarEventsMultiSource', () => {
	let service: ScheduleService;
	let calendarEventApi: CalendarEventApi;

	const envelope: CalendarSearchEnvelope = {
		items: [
			{
				id: 'e1',
				name: 'Workout',
				start: 1000,
				end: 2000,
				source: 'tiler',
				capabilities: {
					canEdit: true,
					canDelete: true,
					canComplete: true,
					canSetAsNow: true,
				},
			},
		],
		sources: [{ source: 'tiler', status: 'success', queryMode: 'native-query' }],
		correlationId: 'corr-1',
	};

	const okResponse: ApiResponse<CalendarSearchEnvelope> = {
		Error: { Code: '0', Message: 'OK' },
		Content: envelope,
		ServerStatus: null,
	};

	const errorBody = {
		error: 'search_unavailable',
		message: 'Search is temporarily unavailable',
		category: 'authentication',
		correlationId: 'corr-1',
		sources: [{ provider: 'google', email: 'user@gmail.com', category: 'authentication' }],
	};

	beforeEach(() => {
		calendarEventApi = new CalendarEventApi();
		service = new ScheduleService(
			new ScheduleApi(),
			new SubCalendarEventApi(),
			calendarEventApi,
			new LocationApi()
		);
		vi.clearAllMocks();
	});

	it('calls the API and unwraps the PostBack Content envelope', async () => {
		vi.mocked(calendarEventApi.searchCalendarEvents).mockResolvedValueOnce(okResponse);

		const result = await service.searchCalendarEventsMultiSource('coffee');

		expect(calendarEventApi.searchCalendarEvents).toHaveBeenCalledWith({
			query: 'coffee',
			sources: undefined,
		});
		expect(result).toEqual(envelope);
		expect(result!.items).toHaveLength(1);
	});

	it('forwards optional sources to the API', async () => {
		vi.mocked(calendarEventApi.searchCalendarEvents).mockResolvedValueOnce(okResponse);

		await service.searchCalendarEventsMultiSource('coffee', ['tiler', 'google']);

		expect(calendarEventApi.searchCalendarEvents).toHaveBeenCalledWith({
			query: 'coffee',
			sources: ['tiler', 'google'],
		});
	});

	it('maps a 502 to a typed CalendarSearchUnavailableError carrying the body fields', async () => {
		vi.mocked(calendarEventApi.searchCalendarEvents).mockRejectedValueOnce(
			new ServerError(
				'HTTP error! status: 502',
				'https://test.example.com/api/CalendarEvent/Search',
				errorBody,
				502
			)
		);

		const p = service.searchCalendarEventsMultiSource('coffee');
		const err = (await p.catch((e) => e)) as CalendarSearchUnavailableError;

		expect(err).toBeInstanceOf(CalendarSearchUnavailableError);
		expect(err.error).toBe('search_unavailable');
		expect(err.message).toBe('Search is temporarily unavailable');
		expect(err.category).toBe('authentication');
		expect(err.correlationId).toBe('corr-1');
		expect(err.sources).toEqual(errorBody.sources);
	});

	it('maps a plain 404 to null', async () => {
		vi.mocked(calendarEventApi.searchCalendarEvents).mockRejectedValueOnce(
			new ServerError(
				'HTTP error! status: 404',
				'https://test.example.com/api/CalendarEvent/Search',
				undefined,
				404
			)
		);

		const result = await service.searchCalendarEventsMultiSource('coffee');

		expect(result).toBeNull();
	});

	it('throws a normalized error for other failures', async () => {
		vi.mocked(calendarEventApi.searchCalendarEvents).mockRejectedValueOnce(new Error('boom'));

		await expect(service.searchCalendarEventsMultiSource('coffee')).rejects.toThrow();
	});
});
