import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import {
	ANONYMOUS_ID_KEY,
	SESSION_KEY,
	SESSION_TIMEOUT_MS,
	getAnonymousId,
	getSessionId,
	touchSession,
} from './identity';

const clearCookies = () => {
	for (const entry of document.cookie.split(';')) {
		const name = entry.split('=')[0]?.trim();
		if (name) document.cookie = `${name}=; Max-Age=0; path=/`;
	}
};

beforeEach(() => {
	localStorage.clear();
	clearCookies();
});

afterEach(() => {
	vi.useRealTimers();
});

describe('getAnonymousId', () => {
	it('mints an id on first call and persists it', () => {
		const id = getAnonymousId();

		expect(id).toMatch(/^[0-9a-f-]{36}$/i);
		expect(localStorage.getItem(ANONYMOUS_ID_KEY)).toBe(id);
	});

	it('returns the same id on every subsequent call', () => {
		expect(getAnonymousId()).toBe(getAnonymousId());
	});

	it('survives a reload by reading back from storage', () => {
		localStorage.setItem(ANONYMOUS_ID_KEY, 'pre-existing-id');
		expect(getAnonymousId()).toBe('pre-existing-id');
	});

	it('mirrors the id into a first party cookie', () => {
		const id = getAnonymousId();
		expect(document.cookie).toContain(id);
	});

	it('recovers the id from the cookie when localStorage was cleared', () => {
		const id = getAnonymousId();
		localStorage.clear();

		expect(getAnonymousId()).toBe(id);
		expect(localStorage.getItem(ANONYMOUS_ID_KEY)).toBe(id);
	});

	it('does not collide with the chat session or persona user storage keys', () => {
		getAnonymousId();

		expect(ANONYMOUS_ID_KEY).not.toBe('chat_session_id');
		expect(ANONYMOUS_ID_KEY).not.toBe('tiler-persona-users');
		expect(localStorage.getItem('chat_session_id')).toBeNull();
		expect(localStorage.getItem('tiler-persona-users')).toBeNull();
	});
});

describe('getSessionId', () => {
	it('mints a session on first call', () => {
		const id = getSessionId();

		expect(id).toMatch(/^[0-9a-f-]{36}$/i);
		expect(localStorage.getItem(SESSION_KEY)).toContain(id);
	});

	it('keeps the same session across rapid calls', () => {
		expect(getSessionId()).toBe(getSessionId());
	});

	it('keeps the same session just before the timeout', () => {
		vi.useFakeTimers();
		const first = getSessionId();

		vi.advanceTimersByTime(SESSION_TIMEOUT_MS - 1000);
		touchSession();

		expect(getSessionId()).toBe(first);
	});

	it('rolls the session after the inactivity timeout', () => {
		vi.useFakeTimers();
		const first = getSessionId();

		vi.advanceTimersByTime(SESSION_TIMEOUT_MS + 1000);

		expect(getSessionId()).not.toBe(first);
	});

	it('slides the window on activity so an active user keeps one session', () => {
		vi.useFakeTimers();
		const first = getSessionId();

		for (let i = 0; i < 5; i++) {
			vi.advanceTimersByTime(SESSION_TIMEOUT_MS - 60_000);
			touchSession();
		}

		expect(getSessionId()).toBe(first);
	});

	it('recovers from corrupt session storage instead of throwing', () => {
		localStorage.setItem(SESSION_KEY, 'not json');
		expect(() => getSessionId()).not.toThrow();
		expect(getSessionId()).toMatch(/^[0-9a-f-]{36}$/i);
	});
});
