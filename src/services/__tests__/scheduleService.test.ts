import { describe, it, expect, vi, beforeEach } from 'vitest';
import ScheduleService from '../scheduleService';
import { ScheduleApi } from '@/api/scheduleApi';
import { SubCalendarEventApi } from '@/api/subCalendarEventApi';
import { CalendarEventApi } from '@/api/calendarEventApi';
import { CalendarEvent } from '@/core/common/types/schedule';

// Mock the API classes
vi.mock('@/api/scheduleApi');
vi.mock('@/api/subCalendarEventApi');
vi.mock('@/api/calendarEventApi');
vi.mock('@/config/config_getter', () => ({
	Env: { get: () => 'https://test.example.com/' },
}));

describe('ScheduleService', () => {
	let service: ScheduleService;
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
		const scheduleApi = new ScheduleApi();
		const subCalendarEventApi = new SubCalendarEventApi();
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
});
