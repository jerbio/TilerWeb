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
			endfOfDay: string;
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
			endfOfDay: string;
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
