import { describe, it, expect } from 'vitest';
import { normalizeRootId } from './tilerEventUtils';

describe('tilerEventUtils', () => {
	describe('normalizeRootId', () => {
		it('derives the root id from a full sub-event id', () => {
			expect(normalizeRootId('root123_5_2_9')).toBe('root123_7_0_0');
		});

		it('is idempotent for already-normalized ids', () => {
			expect(normalizeRootId('root123_7_0_0')).toBe('root123_7_0_0');
		});

		it('handles a bare root id with no suffix', () => {
			expect(normalizeRootId('root123')).toBe('root123_7_0_0');
		});

		it('handles an empty id', () => {
			expect(normalizeRootId('')).toBe('_7_0_0');
		});
	});
});
