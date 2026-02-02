import '@testing-library/jest-dom/vitest';
import { afterAll, afterEach, beforeAll, beforeEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import { server } from './mocks/server';

// Start MSW server before all tests
beforeAll(() => {
	server.listen({ onUnhandledRequest: 'warn' });
});

// Reset handlers after each test (removes runtime handlers added during tests)
afterEach(() => {
	server.resetHandlers();
});

// Close MSW server after all tests
afterAll(() => {
	server.close();
});

// Explicit cleanup after each test
afterEach(() => {
	cleanup();
});

// Clear localStorage before each test
beforeEach(() => {
	localStorage.clear();
});

// Reset timers if fake timers were used
afterEach(() => {
	vi.useRealTimers();
});

// Mock static assets with unique identifiers to allow verification
vi.mock('@/assets/add_block.svg', () => ({ default: 'mock:add_block.svg' }));
vi.mock('@/assets/add_new_tile.svg', () => ({ default: 'mock:add_new_tile.svg' }));
vi.mock('@/assets/update_tile.svg', () => ({ default: 'mock:update_tile.svg' }));
vi.mock('@/assets/delete_tile.svg', () => ({ default: 'mock:delete_tile.svg' }));
vi.mock('@/assets/exited_action.svg', () => ({ default: 'mock:exited_action.svg' }));
vi.mock('@/assets/clear_all.svg', () => ({ default: 'mock:clear_all.svg' }));
