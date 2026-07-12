import { describe, it, expect, beforeEach } from 'vitest';
import {
	getDeepThinkingForSession,
	setDeepThinkingForSession,
	clearDeepThinkingForSession,
} from './chatSessionDeepThinking';

describe('chatSessionDeepThinking storage (M6.5)', () => {
	beforeEach(() => {
		localStorage.clear();
	});

	it('returns false for an unknown sessionId', () => {
		expect(getDeepThinkingForSession('session-a')).toBe(false);
	});

	it('persists and reads true per sessionId', () => {
		setDeepThinkingForSession('session-a', true);
		expect(getDeepThinkingForSession('session-a')).toBe(true);
		expect(getDeepThinkingForSession('session-b')).toBe(false);
	});

	it('removes the entry when set to false', () => {
		setDeepThinkingForSession('session-a', true);
		setDeepThinkingForSession('session-a', false);
		expect(getDeepThinkingForSession('session-a')).toBe(false);
	});

	it('clear removes the stored value', () => {
		setDeepThinkingForSession('session-a', true);
		clearDeepThinkingForSession('session-a');
		expect(getDeepThinkingForSession('session-a')).toBe(false);
	});

	it('no-ops on empty sessionId', () => {
		setDeepThinkingForSession('', true);
		expect(getDeepThinkingForSession('')).toBe(false);
	});
});
