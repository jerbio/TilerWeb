import { http, HttpResponse } from 'msw';

// Default handlers for common API endpoints
// Add handlers as needed for integration tests
export const handlers = [
	// GET api/User - Get current user (matches UserApi.getCurrentUser)
	http.get('*/api/User', () => {
		return HttpResponse.json({
			Error: { Code: '0', Message: '' },
			Content: {
				user: {
					id: 'test-user-id',
					username: 'testuser',
					timeZoneDifference: 0,
					timeZone: 'UTC',
					email: 'test@example.com',
					endOfDay: '0001-01-01T00:00:00+00:00',
					phoneNumber: '',
					fullName: 'Test User',
					firstName: 'Test',
					lastName: 'User',
					countryCode: null,
					dateOfBirth: '',
				},
			},
			ServerStatus: null,
		});
	}),

	// PUT api/User - Update user (matches UserApi.updateUser)
	http.put('*/api/User', () => {
		return HttpResponse.json({
			Error: { Code: '0', Message: '' },
			Content: {
				user: {
					id: 'test-user-id',
					username: 'testuser',
					timeZoneDifference: 0,
					timeZone: 'UTC',
					email: 'test@example.com',
					endOfDay: '0001-01-01T00:00:00+00:00',
					phoneNumber: '',
					fullName: 'Test User',
					firstName: 'Test',
					lastName: 'User',
					countryCode: '',
					dateOfBirth: '',
				},
			},
			ServerStatus: null,
		});
	}),

	// GET account/checkauth - Auth check (matches AuthApi.checkAuth)
	http.get('*/account/checkauth', () => {
		return new HttpResponse('OK', { status: 200 });
	}),
];
