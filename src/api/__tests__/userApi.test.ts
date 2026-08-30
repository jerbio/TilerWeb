import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UserApi, type UserSettingsResponse } from '../userApi';

vi.mock('@/config/config_getter', () => ({
	Env: {
		get: () => 'https://test.example.com/',
	},
}));

const fetchSpy = vi.spyOn(globalThis, 'fetch');

describe('UserApi', () => {
	beforeEach(() => {
		fetchSpy.mockReset();
	});

	it('requests v2 settings', async () => {
		const response: UserSettingsResponse = {
			Error: { Code: '0', Message: 'SUCCESS' },
			Content: {
				settings: {
					userPreference: {
						id: 'preference-id',
						notifcationEnabled: true,
						notifcationEnabledMs: 0,
						emailNotificationEnabled: true,
						textNotificationEnabled: false,
						pushNotificationEnabled: true,
						tileNotificationEnabled: true,
					},
					marketingPreference: {
						id: 'marketing-id',
						disableAll: false,
						disableEmail: false,
						disableTextMsg: false,
					},
					scheduleProfile: {
						travelMedium: 'driving',
						pinPreference: 'start',
						intensityRate: 0.5,
						endTimeOfDay: '22:00:00',
						sleepDuration: 28800000,
					},
					mobileUiScheme: {
						id: 'mobile-id',
						scheduleProfileId: 'profile-id',
						name: 'Default',
						mainColor: '#000000',
						accentColor: '#ffffff',
						fontFamily: 'Urbanist',
						fontSize: 14,
						fontWeight: '400',
						isDefault: true,
						themeMode: 'system',
					},
					desktopUiScheme: {
						id: 'desktop-id',
						scheduleProfileId: 'profile-id',
						name: 'Default',
						mainColor: '#000000',
						accentColor: '#ffffff',
						fontFamily: 'Urbanist',
						fontSize: 14,
						fontWeight: '400',
						isDefault: true,
						themeMode: 'system',
					},
				},
			},
			ServerStatus: null,
		};

		fetchSpy.mockResolvedValueOnce(
			new Response(JSON.stringify(response), {
				status: 200,
				headers: { 'Content-Type': 'application/json' },
			})
		);

		await new UserApi().getSettings();

		expect(fetchSpy).toHaveBeenCalledOnce();
		const [url] = fetchSpy.mock.calls[0];
		const urlString = typeof url === 'string' ? url : (url as Request).url;
		expect(urlString).toContain('api/User/Settings?version=v2');
	});
});
