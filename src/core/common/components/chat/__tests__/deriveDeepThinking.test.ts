import { describe, it, expect } from 'vitest';
import { deriveDeepThinkingFromMessages } from '../deriveDeepThinking';

describe('deriveDeepThinkingFromMessages', () => {
	it('returns fallback when message list is empty', () => {
		expect(deriveDeepThinkingFromMessages([], true)).toBe(true);
		expect(deriveDeepThinkingFromMessages([], false)).toBe(false);
	});

	it('returns fallback when no message has a thinkingMode', () => {
		expect(deriveDeepThinkingFromMessages([{}, {}], true)).toBe(true);
		expect(deriveDeepThinkingFromMessages([{ thinkingMode: '' }], true)).toBe(true);
	});

	it('returns true when most recent message thinkingMode is Deep', () => {
		expect(
			deriveDeepThinkingFromMessages(
				[{ thinkingMode: 'Standard' }, { thinkingMode: 'Deep' }],
				false
			)
		).toBe(true);
	});

	it('returns false when most recent message thinkingMode is Standard', () => {
		expect(
			deriveDeepThinkingFromMessages(
				[{ thinkingMode: 'Deep' }, { thinkingMode: 'Standard' }],
				true
			)
		).toBe(false);
	});

	it('returns false when most recent message thinkingMode is Quick', () => {
		expect(deriveDeepThinkingFromMessages([{ thinkingMode: 'Quick' }], true)).toBe(false);
	});

	it('is case-insensitive', () => {
		expect(deriveDeepThinkingFromMessages([{ thinkingMode: 'deep' }], false)).toBe(true);
		expect(deriveDeepThinkingFromMessages([{ thinkingMode: 'DEEP' }], false)).toBe(true);
	});

	it('walks backwards past messages without thinkingMode', () => {
		expect(
			deriveDeepThinkingFromMessages(
				[{ thinkingMode: 'Deep' }, {}, { thinkingMode: undefined }],
				false
			)
		).toBe(true);
	});
});
