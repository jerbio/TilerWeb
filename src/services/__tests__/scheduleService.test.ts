import { describe, it, expect, vi, beforeEach } from 'vitest';
import ScheduleService from '../scheduleService';
import { ScheduleApi } from '@/api/scheduleApi';
import { SubCalendarEventApi } from '@/api/subCalendarEventApi';
import { CalendarEventApi } from '@/api/calendarEventApi';
import { CalendarEvent, ScheduleProcrastinateAllParams, ScheduleReviseParams, ScheduleShuffleParams } from '@/core/common/types/schedule';

// Mock the API classes
vi.mock('@/api/scheduleApi');
vi.mock('@/api/subCalendarEventApi');
vi.mock('@/api/calendarEventApi');
vi.mock('@/config/config_getter', () => ({
	Env: { get: () => 'https://test.example.com/' },
}));

describe('ScheduleService', () => {
	let service: ScheduleService;
	let scheduleApi: ScheduleApi;
	let subCalendarEventApi: SubCalendarEventApi;
	let calendarEventApi: CalendarEventApi;

	const mockCalendarEvent: CalendarEvent = {
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
		uiConfig: { id: '9dc0da1f-f7f9-42db-aefd-f491352d0c64' } as CalendarEvent['uiConfig'],
		repetition: null,
		eachTileDuration: 5400000,
		restrictionProfile: null,
		emojis: null,
		isWhatIf: false,
		entityName: 'CalendarEvent',
		blob: { type: 0, note: '', id: 'bb6b9d9e-1a33-4173-93a9-1f64cc7879e9' },
		subEvents: null,
	};

	beforeEach(() => {
		scheduleApi = new ScheduleApi();
		subCalendarEventApi = new SubCalendarEventApi();
		calendarEventApi = new CalendarEventApi();
		service = new ScheduleService(scheduleApi, subCalendarEventApi, calendarEventApi);
	});

	describe('searchCalendarEventsByName', () => {
		it('returns calendar events matching the search query', async () => {
			vi.mocked(calendarEventApi.searchByName).mockResolvedValueOnce({
				Error: { Code: '0', Message: 'SUCCESS' },
				Content: [mockCalendarEvent],
				ServerStatus: null,
			});

			const results = await service.searchCalendarEventsByName('work out', 'ashtondemo', 'user-id-123');

			expect(calendarEventApi.searchByName).toHaveBeenCalledWith({
				data: 'work out',
				userName: 'ashtondemo',
				userId: 'user-id-123',
			});
			expect(results).toHaveLength(1);
			expect(results[0].id).toBe('30d305cd-18ee-4c0e-bba0-9e5a6dfab2ed_7_0_0');
			expect(results[0].name).toBe('work out');
			expect(results[0].start).toBe(1769925600000);
			expect(results[0].isRecurring).toBe(true);
			expect(results[0].locationId).toBe('7147101b-b226-4bf0-95f5-b9a6959c4689');
		});

		it('passes pagination params to the API when provided', async () => {
			vi.mocked(calendarEventApi.searchByName).mockResolvedValueOnce({
				Error: { Code: '0', Message: 'SUCCESS' },
				Content: [mockCalendarEvent],
				ServerStatus: null,
			});

			await service.searchCalendarEventsByName('work out', 'ashtondemo', 'user-id-123', { batchSize: 10, index: 1 });

			expect(calendarEventApi.searchByName).toHaveBeenCalledWith({
				data: 'work out',
				userName: 'ashtondemo',
				userId: 'user-id-123',
				batchSize: 10,
				index: 1,
			});
		});

		it('returns empty array when no results', async () => {
			vi.mocked(calendarEventApi.searchByName).mockResolvedValueOnce({
				Error: { Code: '0', Message: 'SUCCESS' },
				Content: [],
				ServerStatus: null,
			});

			const results = await service.searchCalendarEventsByName('nonexistent', 'ashtondemo', 'user-id-123');

			expect(results).toEqual([]);
		});

		it('throws normalized error on API failure', async () => {
			vi.mocked(calendarEventApi.searchByName).mockRejectedValueOnce(
				new Error('Network error'),
			);

			await expect(
				service.searchCalendarEventsByName('drinks', 'ashtondemo', 'user-id-123'),
			).rejects.toThrow();
		});
	});

	describe('setCalendarEventAsNow', () => {
		it('calls setAsNow on calendarEventApi and returns Content', async () => {
			vi.mocked(calendarEventApi.setAsNow).mockResolvedValueOnce({
				Error: { Code: '0', Message: 'SUCCESS' },
				Content: mockCalendarEvent,
				ServerStatus: null,
			});

			const result = await service.setCalendarEventAsNow('event-id-123');

			expect(calendarEventApi.setAsNow).toHaveBeenCalledWith('event-id-123');
			expect(result.id).toBe('30d305cd-18ee-4c0e-bba0-9e5a6dfab2ed_7_0_0');
			expect(result.name).toBe('work out');
		});

		it('throws normalized error on API failure', async () => {
			vi.mocked(calendarEventApi.setAsNow).mockRejectedValueOnce(
				new Error('Network error'),
			);

			await expect(
				service.setCalendarEventAsNow('bad-id'),
			).rejects.toThrow();
		});
	});

	describe('markCalendarEventComplete', () => {
		it('calls markAsComplete on calendarEventApi and returns Content', async () => {
			vi.mocked(calendarEventApi.markAsComplete).mockResolvedValueOnce({
				Error: { Code: '0', Message: 'SUCCESS' },
				Content: mockCalendarEvent,
				ServerStatus: null,
			});

			const result = await service.markCalendarEventComplete('event-id-456');

			expect(calendarEventApi.markAsComplete).toHaveBeenCalledWith('event-id-456');
			expect(result.id).toBe('30d305cd-18ee-4c0e-bba0-9e5a6dfab2ed_7_0_0');
			expect(result.name).toBe('work out');
		});

		it('throws normalized error on API failure', async () => {
			vi.mocked(calendarEventApi.markAsComplete).mockRejectedValueOnce(
				new Error('Network error'),
			);

			await expect(
				service.markCalendarEventComplete('bad-id'),
			).rejects.toThrow();
		});
	});

	describe('deleteCalendarEvent', () => {
		it('calls deleteCalendarEvent on calendarEventApi and returns Content', async () => {
			vi.mocked(calendarEventApi.deleteCalendarEvent).mockResolvedValueOnce({
				Error: { Code: '0', Message: 'SUCCESS' },
				Content: mockCalendarEvent,
				ServerStatus: null,
			});

			const result = await service.deleteCalendarEvent('event-id-789');

			expect(calendarEventApi.deleteCalendarEvent).toHaveBeenCalledWith('event-id-789');
			expect(result.id).toBe('30d305cd-18ee-4c0e-bba0-9e5a6dfab2ed_7_0_0');
			expect(result.name).toBe('work out');
		});

		it('throws normalized error on API failure', async () => {
			vi.mocked(calendarEventApi.deleteCalendarEvent).mockRejectedValueOnce(
				new Error('Network error'),
			);

			await expect(
				service.deleteCalendarEvent('bad-id'),
			).rejects.toThrow();
		});
	});

	describe('shuffleSchedule', () => {
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

		it('calls shuffle on scheduleApi and returns Content', async () => {
			vi.mocked(scheduleApi.shuffle).mockResolvedValueOnce({
				Error: { Code: '0', Message: 'SUCCESS' },
				Content: { subCalendarEvents: [] },
				ServerStatus: null,
			});

			const result = await service.shuffleSchedule(shuffleParams);

			expect(scheduleApi.shuffle).toHaveBeenCalledWith(shuffleParams);
			expect(result).toEqual({ subCalendarEvents: [] });
		});

		it('throws normalized error on API failure', async () => {
			vi.mocked(scheduleApi.shuffle).mockRejectedValueOnce(
				new Error('Network error'),
			);

			await expect(
				service.shuffleSchedule(shuffleParams),
			).rejects.toThrow();
		});
	});

	describe('reviseSchedule', () => {
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

		it('calls revise on scheduleApi and returns Content', async () => {
			vi.mocked(scheduleApi.revise).mockResolvedValueOnce({
				Error: { Code: '0', Message: 'SUCCESS' },
				Content: { subCalendarEvents: [] },
				ServerStatus: null,
			});

			const result = await service.reviseSchedule(reviseParams);

			expect(scheduleApi.revise).toHaveBeenCalledWith(reviseParams);
			expect(result).toEqual({ subCalendarEvents: [] });
		});

		it('throws normalized error on API failure', async () => {
			vi.mocked(scheduleApi.revise).mockRejectedValueOnce(
				new Error('Network error'),
			);

			await expect(
				service.reviseSchedule(reviseParams),
			).rejects.toThrow();
		});
	});

	describe('procrastinateAllSchedule', () => {
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

		it('calls procrastinateAll on scheduleApi and returns Content', async () => {
			vi.mocked(scheduleApi.procrastinateAll).mockResolvedValueOnce({
				Error: { Code: '0', Message: 'SUCCESS' },
				Content: { subCalendarEvents: [] },
				ServerStatus: null,
			});

			const result = await service.procrastinateAllSchedule(procrastinateAllParams);

			expect(scheduleApi.procrastinateAll).toHaveBeenCalledWith(procrastinateAllParams);
			expect(result).toEqual({ subCalendarEvents: [] });
		});

		it('throws normalized error on API failure', async () => {
			vi.mocked(scheduleApi.procrastinateAll).mockRejectedValueOnce(
				new Error('Network error'),
			);

			await expect(
				service.procrastinateAllSchedule(procrastinateAllParams),
			).rejects.toThrow();
		});
	});

	describe('updateSubCalendarEvent', () => {
		const mockSubCalendarEvent = {
			id: 'sub-event-123',
			start: 1769925600000,
			end: 1769929200000,
			name: 'Test Event',
			calendarEventEnd: 1770532200000,
		};

		it('calls updateSubCalendarEvent on subCalendarEventApi with start and end times', async () => {
			vi.mocked(subCalendarEventApi.updateSubCalendarEvent).mockResolvedValueOnce({
				Error: { Code: '0', Message: 'SUCCESS' },
				Content: mockSubCalendarEvent,
				ServerStatus: null,
			});

			const updates = { start: 1769930000000, end: 1769933600000 };
			const result = await service.updateSubCalendarEvent('sub-event-123', updates);

			expect(subCalendarEventApi.updateSubCalendarEvent).toHaveBeenCalledWith({
				Id: 'sub-event-123',
				SubCalendarEventStart: 1769930000000,
				SubCalendarEventEnd: 1769933600000,
				CalendarEventEnd: undefined,
				TimeZone: expect.any(String),
			});
			expect(result).toEqual(mockSubCalendarEvent);
		});

		it('calls updateSubCalendarEvent with only start time when end is not provided', async () => {
			vi.mocked(subCalendarEventApi.updateSubCalendarEvent).mockResolvedValueOnce({
				Error: { Code: '0', Message: 'SUCCESS' },
				Content: mockSubCalendarEvent,
				ServerStatus: null,
			});

			const updates = { start: 1769930000000 };
			await service.updateSubCalendarEvent('sub-event-123', updates);

			expect(subCalendarEventApi.updateSubCalendarEvent).toHaveBeenCalledWith({
				Id: 'sub-event-123',
				SubCalendarEventStart: 1769930000000,
				SubCalendarEventEnd: undefined,
				CalendarEventEnd: undefined,
				TimeZone: expect.any(String),
			});
		});

		it('calls updateSubCalendarEvent with calendarEnd when provided', async () => {
			vi.mocked(subCalendarEventApi.updateSubCalendarEvent).mockResolvedValueOnce({
				Error: { Code: '0', Message: 'SUCCESS' },
				Content: mockSubCalendarEvent,
				ServerStatus: null,
			});

			const updates = { start: 1769930000000, end: 1769933600000, calendarEnd: 1770600000000 };
			await service.updateSubCalendarEvent('sub-event-123', updates);

			expect(subCalendarEventApi.updateSubCalendarEvent).toHaveBeenCalledWith({
				Id: 'sub-event-123',
				SubCalendarEventStart: 1769930000000,
				SubCalendarEventEnd: 1769933600000,
				CalendarEventEnd: 1770600000000,
				TimeZone: expect.any(String),
			});
		});

		it('includes timezone in the payload', async () => {
			vi.mocked(subCalendarEventApi.updateSubCalendarEvent).mockResolvedValueOnce({
				Error: { Code: '0', Message: 'SUCCESS' },
				Content: mockSubCalendarEvent,
				ServerStatus: null,
			});

			await service.updateSubCalendarEvent('sub-event-123', { start: 1769930000000 });

			const calledWith = vi.mocked(subCalendarEventApi.updateSubCalendarEvent).mock.calls[0][0];
			expect(calledWith.TimeZone).toBeDefined();
			expect(typeof calledWith.TimeZone).toBe('string');
		});

		it('throws normalized error on API failure', async () => {
			vi.mocked(subCalendarEventApi.updateSubCalendarEvent).mockRejectedValueOnce(
				new Error('Network error'),
			);

			await expect(
				service.updateSubCalendarEvent('sub-event-123', { start: 1769930000000 }),
			).rejects.toThrow();
		});
	});
});
