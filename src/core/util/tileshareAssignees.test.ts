import { buildAssignees, designatedToAvatars } from './tileshareAssignees';
import type {
	DesignatedUser,
	TileShareTemplate,
	TileshareUserProfile,
} from '@/core/common/types/tileshare';

function profile(over: Partial<TileshareUserProfile>): TileshareUserProfile {
	return {
		id: null,
		username: null,
		timeZoneDifference: null,
		timeZone: null,
		email: null,
		endfOfDay: null,
		endOfDay: null,
		phoneNumber: null,
		fullName: null,
		firstName: null,
		lastName: null,
		countryCode: null,
		...over,
	};
}

function designated(over: Partial<DesignatedUser>): DesignatedUser {
	return {
		displayedIdentifier: null,
		userId: null,
		designatedTileTemplateId: null,
		userProfile: null,
		rsvpStatus: null,
		completionPct: null,
		...over,
	};
}

function tilette(id: string, users: DesignatedUser[]): TileShareTemplate {
	return {
		id,
		name: id,
		creator: null,
		designatedUsers: users,
		clusterId: 'c',
		duration: null,
		start: null,
		end: null,
		miscData: null,
	};
}

const jess = designated({
	userId: 'u1',
	displayedIdentifier: 'jess@x.com',
	userProfile: profile({ firstName: 'Jessica', lastName: 'Jones', email: 'jess@x.com' }),
});
const monica = designated({
	userId: 'u2',
	displayedIdentifier: 'monica@x.com',
	userProfile: profile({ firstName: 'Monica', lastName: 'Smith' }),
});

describe('buildAssignees', () => {
	it('groups tilettes under each designated user', () => {
		const result = buildAssignees([tilette('t1', [jess, monica]), tilette('t2', [jess])]);

		expect(result).toHaveLength(2);
		const jessica = result.find((a) => a.id === 'u1');
		expect(jessica?.tilettes.map((t) => t.id)).toEqual(['t1', 't2']);
		expect(result.find((a) => a.id === 'u2')?.tilettes.map((t) => t.id)).toEqual(['t1']);
	});

	it('formats the name as first name + last initial', () => {
		const [jessica] = buildAssignees([tilette('t1', [jess])]);
		expect(jessica.name).toBe('Jessica J.');
	});

	it('falls back to the displayed identifier when no profile name', () => {
		const anon = designated({ userId: 'u9', displayedIdentifier: 'anon@x.com' });
		const [a] = buildAssignees([tilette('t1', [anon])]);
		expect(a.name).toBe('anon@x.com');
	});

	it('skips designated users without any key', () => {
		const keyless = designated({ userId: null, displayedIdentifier: null });
		expect(buildAssignees([tilette('t1', [keyless])])).toHaveLength(0);
	});

	it('handles tilettes with null designatedUsers', () => {
		const t = tilette('t1', []);
		t.designatedUsers = null;
		expect(buildAssignees([t])).toHaveLength(0);
	});
});

describe('designatedToAvatars', () => {
	it('maps profiles to avatar users, preferring full name', () => {
		const withFull = designated({
			displayedIdentifier: 'x@x.com',
			userProfile: profile({ fullName: 'Full Name', email: 'x@x.com' }),
		});
		expect(designatedToAvatars([withFull])).toEqual([{ name: 'Full Name', email: 'x@x.com' }]);
	});

	it('returns an empty array for null', () => {
		expect(designatedToAvatars(null)).toEqual([]);
	});
});
