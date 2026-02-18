import { http, HttpResponse } from 'msw';

// MSW handlers for integration tests
// For unit tests, prefer service mocking with vi.mock('@/services')
// Example:
//   vi.mock('@/services', () => ({
//     userService: {
//       getSettings: vi.fn(),
//       updateSettings: vi.fn(),
//     },
//   }));

export const handlers = [
	// Add handlers here as needed for integration tests
];

// Re-export for convenience if needed in test files
export { http, HttpResponse };
