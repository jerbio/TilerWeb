import { http, HttpResponse } from 'msw';

// Default handlers for common API endpoints
// Add handlers as needed for integration tests
export const handlers = [
	// Example: User endpoint
	http.get('/api/User/Info', () => {
		return HttpResponse.json({
			Content: {
				id: 'test-user-id',
				username: 'testuser',
				timeZoneDifference: 0,
				timeZone: 'UTC',
				email: 'test@example.com',
				endfOfDay: null,
				phoneNumber: null,
				fullName: 'Test User',
				firstName: 'Test',
				lastName: 'User',
				countryCode: null,
				dateOfBirth: null,
			},
		});
	}),

	// Example: Auth check endpoint
	http.get('/account/checkauth', () => {
		return new HttpResponse('OK', { status: 200 });
	}),
];
