import { describe, it, expect } from 'vitest';
import {
	getStoredSessionId,
	setStoredSessionId,
	clearStoredSessionId,
} from './chatSession';

describe('chatSession storage', () => {
	// localStorage is cleared in setup.ts beforeEach hook

	describe('getStoredSessionId', () => {
		it('returns null when no session is stored', () => {
			expect(getStoredSessionId()).toBeNull();
		});

		it('returns stored session id', () => {
			localStorage.setItem('chat_session_id', 'test-session-123');
			expect(getStoredSessionId()).toBe('test-session-123');
		});
	});

	describe('setStoredSessionId', () => {
		it('stores session id in localStorage', () => {
			setStoredSessionId('new-session-456');
			expect(localStorage.getItem('chat_session_id')).toBe('new-session-456');
		});

		it('overwrites existing session id', () => {
			setStoredSessionId('first-session');
			setStoredSessionId('second-session');
			expect(getStoredSessionId()).toBe('second-session');
		});

		it('stores empty string', () => {
			setStoredSessionId('');
			expect(getStoredSessionId()).toBe('');
		});

		it('stores UUID-format session ids', () => {
			const uuid = '550e8400-e29b-41d4-a716-446655440000';
			setStoredSessionId(uuid);
			expect(getStoredSessionId()).toBe(uuid);
		});

		it('stores long session ids', () => {
			const longId = 'a'.repeat(1000);
			setStoredSessionId(longId);
			expect(getStoredSessionId()).toBe(longId);
		});
	});

	describe('clearStoredSessionId', () => {
		it('removes session id from localStorage', () => {
			setStoredSessionId('session-to-clear');
			clearStoredSessionId();
			expect(getStoredSessionId()).toBeNull();
		});

		it('does not throw when no session exists', () => {
			expect(() => clearStoredSessionId()).not.toThrow();
		});

		it('clears only the session id key', () => {
			localStorage.setItem('other_key', 'other_value');
			setStoredSessionId('session-123');

			clearStoredSessionId();

			expect(getStoredSessionId()).toBeNull();
			expect(localStorage.getItem('other_key')).toBe('other_value');
		});
	});

	describe('integration: full session lifecycle', () => {
		it('handles complete session lifecycle', () => {
			// Initial state
			expect(getStoredSessionId()).toBeNull();

			// Create session
			setStoredSessionId('lifecycle-session');
			expect(getStoredSessionId()).toBe('lifecycle-session');

			// Update session
			setStoredSessionId('updated-session');
			expect(getStoredSessionId()).toBe('updated-session');

			// Clear session
			clearStoredSessionId();
			expect(getStoredSessionId()).toBeNull();
		});
	});
});
