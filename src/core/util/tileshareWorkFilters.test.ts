import { describe, expect, it } from 'vitest';
import { shareAssignment, shareTilette } from '@/test/tileshare-fixtures';
import { InvitationStatus, TileletteStatus as Stage } from '@/core/common/types/tileshare';
import {
	emptyShareFilters,
	filterTimeZone,
	localDate,
	matchesAssignment,
	matchesEmptyParticipant,
	matchesTilette,
	parseShareFilters,
	type FilterEnvironment,
	type ShareFilters,
} from './tileshareFilters';

const env: FilterEnvironment = {
	now: Date.parse('2026-11-10T18:00:00Z'),
	timeZone: 'America/Denver',
	locale: 'en',
	people: [
		{ Id: 'ada', Email: 'ada@example.com' },
		{ Id: 'bob', Email: 'bob@example.com' },
	],
};
const filters = (changes: Partial<ShareFilters> = {}): ShareFilters => ({
	...emptyShareFilters(),
	...changes,
});
const ada = shareAssignment('ada', InvitationStatus.Accepted, 100);
const bob = shareAssignment('bob', InvitationStatus.None, null);
const task = {
	...shareTilette('Design review', [ada, bob]),
	end: Date.parse('2026-11-11T06:59:59Z'),
};

describe('TileShare work filters', () => {
	it('matches team and individual status without rewriting the assignment data', () => {
		expect(matchesTilette(task, filters({ statuses: [Stage.InProgress] }), env)).toBe(true);
		expect(matchesTilette(task, filters({ statuses: [Stage.Completed] }), env)).toBe(false);
		expect(matchesTilette(task, filters({ statuses: [Stage.Completed] }), env, 'ada')).toBe(
			true
		);
		expect(matchesAssignment(task, bob, filters({ statuses: [Stage.Delegated] }), env)).toBe(
			true
		);
		expect(matchesAssignment(task, ada, filters({ statuses: [Stage.Completed] }), env)).toBe(
			true
		);
		expect(task.designatedUsers).toEqual([ada, bob]);
	});
	it('requires people and response to match the same assignment', () => {
		expect(
			matchesTilette(
				task,
				filters({ people: ['email:ada@example.com'], responses: ['none'] }),
				env
			)
		).toBe(false);
		expect(
			matchesTilette(task, filters({ people: ['id:bob'], responses: ['none'] }), env)
		).toBe(true);
		expect(
			matchesTilette(
				task,
				filters({ people: ['id:bob', 'id:ada'], responses: ['accepted', 'declined'] }),
				env
			)
		).toBe(true);
	});
	it('combines categories with AND and accepts multiple statuses within a category', () => {
		const f = filters({
			statuses: [Stage.Delegated, Stage.InProgress],
			responses: ['none'],
			people: ['id:bob'],
			query: '  DESIGN  ',
			due: 'today',
		});
		expect(matchesTilette(task, f, env)).toBe(true);
		expect(matchesTilette(task, { ...f, query: 'other' }, env)).toBe(false);
	});
	it('bridges id-only assignments and email-only selections through known contact identities', () => {
		const identity = { ...ada, displayedIdentifier: null, userProfile: null };
		expect(
			matchesAssignment(task, identity, filters({ people: ['email:ada@example.com'] }), env)
		).toBe(true);
	});
	it('does not include somebody else’s assignment in a personal view', () => {
		expect(matchesTilette(task, filters(), env, 'missing')).toBe(false);
		expect(matchesTilette(task, filters({ people: ['id:bob'] }), env, 'ada')).toBe(false);
	});
	it('includes empty roster members only in matching empty-assignment contexts', () => {
		const person = { Id: 'ada' };
		expect(matchesEmptyParticipant(person, filters(), env)).toBe(true);
		expect(
			matchesEmptyParticipant(
				person,
				filters({ statuses: [Stage.Unassigned], people: ['email:ada@example.com'] }),
				env
			)
		).toBe(true);
		for (const change of [
			{ responses: ['none'] },
			{ query: 'Design' },
			{ due: 'none' },
			{ statuses: [Stage.Completed] },
		]) {
			expect(
				matchesEmptyParticipant(person, filters(change as Partial<ShareFilters>), env)
			).toBe(false);
		}
	});
	it('maps pending and unknown responses without fabricating invitations for missing assignments', () => {
		expect(
			matchesAssignment(
				task,
				{ ...bob, rsvpStatus: 'pending' },
				filters({ responses: ['none'] }),
				env
			)
		).toBe(true);
		expect(
			matchesAssignment(
				task,
				{ ...bob, rsvpStatus: 'future-status' },
				filters({ responses: ['unknown'] }),
				env
			)
		).toBe(true);
		expect(matchesTilette(shareTilette('Empty'), filters({ responses: ['none'] }), env)).toBe(
			false
		);
	});
	it('uses account-local dates, including the entire last date of a custom range', () => {
		expect(localDate(task.end!, env.timeZone)).toBe('2026-11-10');
		expect(
			matchesTilette(
				task,
				filters({ due: 'custom', from: '2026-11-10', to: '2026-11-10' }),
				env
			)
		).toBe(true);
		expect(
			matchesTilette(
				{ ...task, end: Date.parse('2026-11-11T07:00:00Z') },
				filters({ due: 'today' }),
				env
			)
		).toBe(false);
		expect(
			matchesTilette(
				task,
				filters({ due: 'custom', from: '2026-11-11', to: '2026-11-10' }),
				env
			)
		).toBe(false);
	});
	it('counts the next seven local calendar days across DST rather than 168 hours', () => {
		const dst = { ...env, now: Date.parse('2026-03-07T19:00:00Z') };
		expect(
			matchesTilette(
				{ ...task, end: Date.parse('2026-03-14T05:59:59Z') },
				filters({ due: 'week' }),
				dst
			)
		).toBe(true);
		expect(
			matchesTilette(
				{ ...task, end: Date.parse('2026-03-14T06:00:00Z') },
				filters({ due: 'week' }),
				dst
			)
		).toBe(false);
		const fall = { ...env, now: Date.parse('2026-10-31T18:00:00Z') };
		expect(
			matchesTilette(
				{ ...task, end: Date.parse('2026-11-07T06:59:59Z') },
				filters({ due: 'week' }),
				fall
			)
		).toBe(true);
	});
	it('excludes completed work from overdue but retains unknown accepted completion as unfinished', () => {
		const overdue = { ...task, end: env.now - 1 };
		expect(matchesTilette(overdue, filters({ due: 'overdue' }), env)).toBe(true);
		expect(
			matchesTilette({ ...overdue, designatedUsers: [ada] }, filters({ due: 'overdue' }), env)
		).toBe(false);
		expect(
			matchesTilette(
				{ ...overdue, designatedUsers: [{ ...ada, completionPct: null }] },
				filters({ due: 'overdue' }),
				env
			)
		).toBe(true);
	});
	it.each([null, NaN, Infinity, 9e15])(
		'treats an unavailable deadline as No deadline: %s',
		(end) => {
			expect(matchesTilette({ ...task, end }, filters({ due: 'none' }), env)).toBe(true);
			expect(matchesTilette({ ...task, end }, filters({ due: 'today' }), env)).toBe(false);
		}
	);
	it('recovers safely from invalid stored values and impossible dates', () => {
		expect(parseShareFilters(null)).toEqual(emptyShareFilters());
		expect(
			parseShareFilters({
				statuses: ['todo', 'delegated', 'delegated', 1],
				responses: ['pending', 'unknown'],
				people: ['id:ada', 42],
				due: 'bad',
				from: '2026-13-10',
				to: '2026-02-30',
			})
		).toEqual(
			filters({ statuses: [Stage.Delegated], responses: ['unknown'], people: ['id:ada'] })
		);
		expect(filterTimeZone('invalid')).toBe(Intl.DateTimeFormat().resolvedOptions().timeZone);
		expect(filterTimeZone('America/Denver')).toBe('America/Denver');
	});
});
