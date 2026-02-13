import { ApiCodeResponse } from '@/core/common/types/api';
import { AppApi } from './appApi';

export interface UserResponse {
	Error: {
		Code: string;
		Message: string;
	};
	Content: {
		user: {
			id: string;
			username: string;
			timeZoneDifference: number;
			timeZone: string;
			email: string;
			endOfDay: string;
			phoneNumber: string;
			fullName: string;
			firstName: string;
			lastName: string;
			countryCode: string | null;
			dateOfBirth: string;
		};
	};
	ServerStatus: null;
}

export interface UpdateUserRequest {
	FirstName: string;
	LastName: string;
	UpdatedUserName: string;
	CountryCode: number;
	PhoneNumber: string;
	DateOfBirthUtcEpoch: number;
	EndOfDay: string;
}

export interface UpdateUserResponse {
	Error: ApiCodeResponse;
	Content: {
		user: {
			id: string;
			username: string;
			timeZoneDifference: number;
			timeZone: string;
			email: string;
			endOfDay: string;
			phoneNumber: string;
			fullName: string;
			firstName: string;
			lastName: string;
			countryCode: string;
			dateOfBirth: string;
		};
	};
	ServerStatus: null;
}

export interface UserPreference {
	id: string;
	notifcationEnabled: boolean;
	notifcationEnabledMs: number;
	emailNotificationEnabled: boolean;
	textNotificationEnabled: boolean;
	pushNotificationEnabled: boolean;
	tileNotificationEnabled: boolean;
}

export interface MarketingPreference {
	id: string;
	disableAll: boolean;
	disableEmail: boolean;
	disableTextMsg: boolean;
}

export interface ScheduleProfile {
	travelMedium: string;
	pinPreference: string;
	sleepDuration: number;
}

export interface UiScheme {
	id: string;
	scheduleProfileId: string;
	name: string;
	mainColor: string;
	accentColor: string;
	fontFamily: string;
	fontSize: number;
	fontWeight: string;
	isDefault: boolean;
	themeMode: string;
}

export interface UserSettings {
	userPreference: UserPreference;
	marketingPreference: MarketingPreference;
	scheduleProfile: ScheduleProfile;
	mobileUiScheme: UiScheme;
	desktopUiScheme: UiScheme;
}

export interface UserSettingsResponse {
	Error: ApiCodeResponse;
	Content: {
		settings: UserSettings;
	};
	ServerStatus: null;
}

export interface UpdateSettingsRequest {
	[key: string]: boolean | number | string;
}

export interface UpdateSettingsResponse {
	Error: ApiCodeResponse;
	Content: {
		settings: UserSettings;
	};
	ServerStatus: null;
}

export class UserApi extends AppApi {
	public getCurrentUser() {
		return this.apiRequest<UserResponse>('api/User', {
			method: 'GET',
		});
	}

	public updateUser(userData: UpdateUserRequest) {
		return this.apiRequest<UpdateUserResponse>('api/User', {
			method: 'PUT',
			body: JSON.stringify(userData),
		});
	}

	public getSettings() {
		return this.apiRequest<UserSettingsResponse>('api/User/Settings?mobileApi=true', {
			method: 'GET',
		});
	}

	public updateSettings(settings: UpdateSettingsRequest) {
		return this.apiRequest<UpdateSettingsResponse>('api/User/Settings', {
			method: 'POST',
			body: JSON.stringify(settings),
		});
	}

	public async signIn(userName: string, password: string) {
		const myHeaders = new Headers();
		myHeaders.append('Content-Type', 'text/plain');

		const raw = `username=${userName}&password=${password}&grant_type=password`;

		const requestOptions: RequestInit = {
			method: 'POST',
			headers: myHeaders,
			body: raw,
			credentials: 'include', // Allow ASP.NET to set authentication cookies
		};

		return fetch(`${this.defaultDomain}account/token`, requestOptions)
			.then((response) => response.json())
			.catch((error) => {
				console.error(error);
			});
	}
}
