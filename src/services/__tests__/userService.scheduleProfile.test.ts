import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UserService } from '../userService';
import { UserApi } from '@/api/userApi';
import { ScheduleProfileResponse, UpdateScheduleProfileParams } from '@/core/common/types/schedule';

vi.mock('@/api/userApi');
vi.mock('@/config/config_getter', () => ({
	Env: { get: () => 'https://test.example.com/' },
}));

const mockScheduleProfileContent: ScheduleProfileResponse['Content'] = {
	travelMedium: 'bicycling',
	pinPreference: 'start',
	endTimeOfDay: '12:00:00',
	sleepDuration: 32400000,
	endOfDay: '12:00:00',
	timeZone: 'America/New_York',
	timeZoneDifference: 0,
	personalHoursRestrictionProfile: {
		id: 'personal-id',
		isEnabled: true,
		timeZone: 'America/Denver',
		daySelection: [
			{
				id: 'sun-id',
				weekday: 0,
				restrictionTimeLine: {
					id: 'sun-tl',
					start: 0,
					duration: 86400000,
					end: 0,
					timeZone: 'America/Denver',
				},
				timeZone: 'America/Denver',
			},
			{
				id: 'mon-id',
				weekday: 1,
				restrictionTimeLine: {
					id: 'mon-tl',
					start: 21600000,
					duration: 43200000,
					end: 64800000,
					timeZone: 'America/Denver',
				},
				timeZone: 'America/Denver',
			},
			null,
			null,
			null,
			null,
			null,
		],
	},
	workHoursRestrictionProfile: {
		id: 'work-id',
		isEnabled: true,
		timeZone: 'America/Denver',
		daySelection: [
			null,
			{
				id: 'work-mon-id',
				weekday: 1,
				restrictionTimeLine: {
					id: 'work-mon-tl',
					start: 28800000,
					duration: 36000000,
					end: 64800000,
					timeZone: 'America/Denver',
				},
				timeZone: 'America/Denver',
			},
			null,
			null,
			null,
			null,
			null,
		],
	},
};

describe('UserService - Schedule Profile', () => {
	let service: UserService;
	let userApi: UserApi;

	beforeEach(() => {
		userApi = new UserApi();
		service = new UserService(userApi);
	});

	describe('getScheduleProfile', () => {
		it('returns schedule profile content on success', async () => {
			vi.mocked(userApi.getScheduleProfile).mockResolvedValueOnce({
				Error: { Code: '0', Message: 'SUCCESS' },
				Content: mockScheduleProfileContent,
				ServerStatus: null,
			});

			const result = await service.getScheduleProfile();

			expect(userApi.getScheduleProfile).toHaveBeenCalled();
			expect(result.travelMedium).toBe('bicycling');
			expect(result.personalHoursRestrictionProfile!.daySelection).toHaveLength(7);
			expect(result.workHoursRestrictionProfile!.daySelection![0]).toBeNull();
			expect(result.workHoursRestrictionProfile!.daySelection![1]?.weekday).toBe(1);
		});

		it('throws on API error code', async () => {
			vi.mocked(userApi.getScheduleProfile).mockResolvedValueOnce({
				Error: { Code: '1', Message: 'FAIL' },
				Content: mockScheduleProfileContent,
				ServerStatus: null,
			});

			await expect(service.getScheduleProfile()).rejects.toThrow();
		});

		it('throws on network error', async () => {
			vi.mocked(userApi.getScheduleProfile).mockRejectedValueOnce(new Error('Network error'));

			await expect(service.getScheduleProfile()).rejects.toThrow();
		});
	});

	describe('updateScheduleProfile', () => {
		const updateParams: UpdateScheduleProfileParams = {
			PersonalRestrictionProfile: {
				Id: 'personal-id',
				IsEnabled: true,
				RestrictiveWeek: {
					WeekDayOption: [{ Index: '1', Start: '21600000', End: '64800000' }],
					isEnabled: 'true',
				},
			},
		};

		it('returns updated profile on success', async () => {
			vi.mocked(userApi.updateScheduleProfile).mockResolvedValueOnce({
				Error: { Code: '0', Message: 'SUCCESS' },
				Content: mockScheduleProfileContent,
				ServerStatus: null,
			});

			const result = await service.updateScheduleProfile(updateParams);

			expect(userApi.updateScheduleProfile).toHaveBeenCalledWith(updateParams);
			expect(result.personalHoursRestrictionProfile!.isEnabled).toBe(true);
		});

		it('throws on API error code', async () => {
			vi.mocked(userApi.updateScheduleProfile).mockResolvedValueOnce({
				Error: { Code: '1', Message: 'FAIL' },
				Content: mockScheduleProfileContent,
				ServerStatus: null,
			});

			await expect(service.updateScheduleProfile(updateParams)).rejects.toThrow();
		});
	});
});
