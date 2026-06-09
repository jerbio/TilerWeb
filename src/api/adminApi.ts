import { AppApi } from './appApi';

export interface AdminRolesResponse {
	Error: {
		Code: string;
		Message: string;
	};
	Content: {
		roles: string[];
	};
	ServerStatus: null;
}

export class AdminApi extends AppApi {
	public getRoles() {
		return this.apiRequest<AdminRolesResponse>('api/admin/Roles', {
			method: 'GET',
		});
	}
}

export const adminApi = new AdminApi();
