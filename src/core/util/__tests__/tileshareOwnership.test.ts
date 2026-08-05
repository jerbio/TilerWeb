import { describe, it, expect } from 'vitest';
import { isTileshareOwner } from '../tileshareOwnership';
import type { UserInfo } from '@/global_state';
import type { TileshareUserProfile } from '@/core/common/types/tileshare';

const user = {
	id: 'TilerUser@@abc',
	username: 'alice',
	email: 'alice@example.com',
} as UserInfo;

const creator = (over: Partial<TileshareUserProfile> = {}): TileshareUserProfile =>
	({
		id: null,
		username: null,
		email: null,
		...over,
	}) as TileshareUserProfile;

describe('isTileshareOwner', () => {
	it('matches on id', () => {
		expect(isTileshareOwner(creator({ id: 'TilerUser@@abc' }), user)).toBe(true);
	});

	it('matches on username or email when the id is absent', () => {
		expect(isTileshareOwner(creator({ username: 'alice' }), user)).toBe(true);
		expect(isTileshareOwner(creator({ email: 'alice@example.com' }), user)).toBe(true);
	});

	it('ignores case', () => {
		expect(isTileshareOwner(creator({ email: 'ALICE@example.com' }), user)).toBe(true);
	});

	it('rejects a different user', () => {
		expect(isTileshareOwner(creator({ id: 'TilerUser@@xyz', username: 'bob' }), user)).toBe(
			false
		);
	});

	it('rejects when either side is missing or empty', () => {
		expect(isTileshareOwner(null, user)).toBe(false);
		expect(isTileshareOwner(creator({ id: 'TilerUser@@abc' }), null)).toBe(false);
		expect(isTileshareOwner(creator(), user)).toBe(false);
		// An empty string on both sides must not count as a match.
		expect(isTileshareOwner(creator({ username: '' }), { ...user, username: '' })).toBe(false);
	});
});
