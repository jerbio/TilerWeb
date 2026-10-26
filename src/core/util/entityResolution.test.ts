import { describe, it, expect } from 'vitest';
import {
	extractCalendarEventPrefix,
	resolveEntityToTileId,
	isCalendarEventId,
	resolveThirdPartyToTileId,
	resolveTileForFocus,
} from './entityResolution';
import { CalendarEntityType } from '@/core/common/components/calendar/calendarRequestContext';

// ── Helpers ────────────────────────────────────────────────────

/** Minimal event shape matching what the resolver needs from StyledEvent */
const makeEvent = (id: string, start: number) => ({ id, start });

// ── extractCalendarEventPrefix ─────────────────────────────────

describe('extractCalendarEventPrefix', () => {
	it('extracts first two segments from a CalendarEvent ID', () => {
		expect(extractCalendarEventPrefix('abcd_efgh_0_0')).toBe('abcd_efgh');
	});

	it('extracts first two segments from a SubcalendarEvent ID', () => {
		expect(extractCalendarEventPrefix('abcd_efgh_ijkl_mnop')).toBe('abcd_efgh');
	});

	it('returns the full string when there are fewer than 2 segments', () => {
		expect(extractCalendarEventPrefix('onlyone')).toBe('onlyone');
	});

	it('handles IDs with more than 4 segments', () => {
		expect(extractCalendarEventPrefix('a_b_c_d_e')).toBe('a_b');
	});
});

// ── isCalendarEventId ──────────────────────────────────────────

describe('isCalendarEventId', () => {
	it('returns true for CalendarEvent ID pattern (last two segments are 0)', () => {
		expect(isCalendarEventId('abcd_efgh_0_0')).toBe(true);
	});

	it('returns false for SubcalendarEvent ID pattern', () => {
		expect(isCalendarEventId('abcd_efgh_ijkl_mnop')).toBe(false);
	});

	it('returns false for IDs with only zeroes in one segment', () => {
		expect(isCalendarEventId('abcd_efgh_0_mnop')).toBe(false);
		expect(isCalendarEventId('abcd_efgh_ijkl_0')).toBe(false);
	});

	it('returns false for short IDs', () => {
		expect(isCalendarEventId('abcd')).toBe(false);
	});
});

// ── resolveEntityToTileId ──────────────────────────────────────

describe('resolveEntityToTileId', () => {
	const events = [
		makeEvent('aaa_bbb_111_222', 1000),
		makeEvent('aaa_bbb_333_444', 500), // earliest child of aaa_bbb
		makeEvent('aaa_bbb_555_666', 2000),
		makeEvent('xxx_yyy_111_222', 3000),
	];

	// ── SubcalendarEvent (direct match) ────────────────────────

	it('returns direct match for SubcalendarEvent entityType', () => {
		const result = resolveEntityToTileId(
			'aaa_bbb_111_222',
			CalendarEntityType.SubcalendarEvent,
			events
		);
		expect(result).toBe('aaa_bbb_111_222');
	});

	it('returns null when SubcalendarEvent ID is not found', () => {
		const result = resolveEntityToTileId(
			'zzz_zzz_zzz_zzz',
			CalendarEntityType.SubcalendarEvent,
			events
		);
		expect(result).toBeNull();
	});

	// ── CalendarEvent (prefix match → earliest child) ──────────

	it('resolves CalendarEvent ID to earliest child SubcalendarEvent by start time', () => {
		const result = resolveEntityToTileId(
			'aaa_bbb_0_0',
			CalendarEntityType.CalendarEvent,
			events
		);
		// aaa_bbb_333_444 has start=500 (earliest)
		expect(result).toBe('aaa_bbb_333_444');
	});

	it('returns null when CalendarEvent has no matching children', () => {
		const result = resolveEntityToTileId(
			'zzz_zzz_0_0',
			CalendarEntityType.CalendarEvent,
			events
		);
		expect(result).toBeNull();
	});

	it('resolves CalendarEvent with a single child', () => {
		const result = resolveEntityToTileId(
			'xxx_yyy_0_0',
			CalendarEntityType.CalendarEvent,
			events
		);
		expect(result).toBe('xxx_yyy_111_222');
	});

	it('does not match the CalendarEvent ID itself (ignores _0_0 entries)', () => {
		// If the styledEvents somehow contained a CalendarEvent-shaped ID, skip it
		const eventsWithParent = [
			...events,
			makeEvent('aaa_bbb_0_0', 100), // this should be excluded from children
		];
		const result = resolveEntityToTileId(
			'aaa_bbb_0_0',
			CalendarEntityType.CalendarEvent,
			eventsWithParent
		);
		// Should pick the earliest non-CalendarEvent child: aaa_bbb_333_444 (start=500)
		expect(result).toBe('aaa_bbb_333_444');
	});

	// ── RestrictionProfile ─────────────────────────────────────

	it('returns null for RestrictionProfile entityType (not yet supported)', () => {
		const result = resolveEntityToTileId(
			'some-restriction-id',
			CalendarEntityType.RestrictionProfile,
			events
		);
		expect(result).toBeNull();
	});

	// ── None ───────────────────────────────────────────────────

	it('returns null for None entityType', () => {
		const result = resolveEntityToTileId('whatever', CalendarEntityType.None, events);
		expect(result).toBeNull();
	});

	// ── Edge cases ─────────────────────────────────────────────

	it('returns null when events array is empty', () => {
		expect(
			resolveEntityToTileId('aaa_bbb_0_0', CalendarEntityType.CalendarEvent, [])
		).toBeNull();
		expect(
			resolveEntityToTileId('aaa_bbb_111_222', CalendarEntityType.SubcalendarEvent, [])
		).toBeNull();
	});

	it('handles CalendarEvent with children having equal start times', () => {
		const tied = [makeEvent('tt_uu_aaa_bbb', 1000), makeEvent('tt_uu_ccc_ddd', 1000)];
		const result = resolveEntityToTileId('tt_uu_0_0', CalendarEntityType.CalendarEvent, tied);
		// Both have same start — should return one of them deterministically (first found)
		expect(result).toBe('tt_uu_aaa_bbb');
	});
});

// ── resolveThirdPartyToTileId ──────────────────────────────────────

/** Minimal third-party event shape for the resolver tests */
const makeTpEvent = (
	id: string,
	start: number,
	metadata: {
		thirdPartyType?: string | null;
		thirdPartyId?: string | null;
		thirdPartyUserId?: string | null;
	} = {}
) => ({ id, start, ...metadata });

describe('resolveThirdPartyToTileId', () => {
	const events = [
		makeTpEvent('tp_7_aaa_bbb', 3000, {
			thirdPartyType: 'outlook',
			thirdPartyId: 'GP-1',
			thirdPartyUserId: 'u1',
		}),
		makeTpEvent('tp_7_ccc_ddd', 1000, {
			thirdPartyType: 'google',
			thirdPartyId: 'gp-1',
			thirdPartyUserId: 'u1',
		}),
		makeTpEvent('tp_7_eee_fff', 2000, {
			thirdPartyType: 'google',
			thirdPartyId: 'gp-2',
			thirdPartyUserId: 'u2',
		}),
		makeTpEvent('tp_7_ggg_hhh', 1500, { thirdPartyId: 'gp-1' }),
	];

	it('resolves by thirdPartyId regardless of wire casing (id + type are case-insensitive)', () => {
		expect(resolveThirdPartyToTileId({ thirdPartyId: 'gp-1' }, events)).toBe('tp_7_ccc_ddd');
		expect(
			resolveThirdPartyToTileId({ thirdPartyId: 'GP-1', thirdPartyType: 'Google' }, events)
		).toBe('tp_7_ccc_ddd');
	});

	it('returns null when the reference has no thirdPartyId (id is the stable key)', () => {
		expect(resolveThirdPartyToTileId({ thirdPartyType: 'google' }, events)).toBeNull();
		expect(resolveThirdPartyToTileId({ thirdPartyUserId: 'u1' }, events)).toBeNull();
		expect(resolveThirdPartyToTileId({ thirdPartyId: '' }, events)).toBeNull();
		expect(resolveThirdPartyToTileId({ thirdPartyId: '  ' }, events)).toBeNull();
		expect(resolveThirdPartyToTileId({}, events)).toBeNull();
	});

	it('returns null when no tile carries the referenced thirdPartyId', () => {
		expect(resolveThirdPartyToTileId({ thirdPartyId: 'nope' }, events)).toBeNull();
		expect(resolveThirdPartyToTileId({ thirdPartyId: null }, events)).toBeNull();
	});

	it('applies thirdPartyType as an AND filter (case-insensitive) when present', () => {
		// gp-1 exists on an outlook-typed tile, a google-typed tile and a
		// type-less tile; restrict to OUTLOOK (upper-case to prove the filter
		// itself is case-insensitive) and only the outlook tile survives.
		expect(
			resolveThirdPartyToTileId({ thirdPartyId: 'gp-1', thirdPartyType: 'OUTLOOK' }, events)
		).toBe('tp_7_aaa_bbb');
		// A type filter that no matching tile satisfies → null (gp-2 is google).
		expect(
			resolveThirdPartyToTileId({ thirdPartyId: 'gp-2', thirdPartyType: 'outlook' }, events)
		).toBeNull();
	});

	it('applies thirdPartyUserId as an AND filter when present', () => {
		expect(
			resolveThirdPartyToTileId({ thirdPartyId: 'gp-1', thirdPartyUserId: 'u1' }, events)
		).toBe('tp_7_ccc_ddd');
		expect(
			resolveThirdPartyToTileId(
				{ thirdPartyId: 'gp-1', thirdPartyUserId: 'someone-else' },
				events
			)
		).toBeNull();
	});

	it('picks the earliest tile by start when multiple tiles share the reference', () => {
		const all = [
			makeTpEvent('tp_7_111_222', 5000, { thirdPartyId: 'gp-9' }),
			makeTpEvent('tp_7_333_444', 4000, { thirdPartyId: 'GP-9' }),
			makeTpEvent('tp_7_555_666', 100, { thirdPartyId: 'gp-9' }),
		];
		expect(resolveThirdPartyToTileId({ thirdPartyId: 'gp-9' }, all)).toBe('tp_7_555_666');
	});

	it('returns null for an empty event list', () => {
		expect(resolveThirdPartyToTileId({ thirdPartyId: 'gp-1' }, [])).toBeNull();
	});
});

// ── resolveTileForFocus ────────────────────────────────────────────

describe('resolveTileForFocus', () => {
	const events = [
		makeTpEvent('s_7_aaa_bbb', 1000, {
			thirdPartyType: 'google',
			thirdPartyId: 'gp-evt-99',
			thirdPartyUserId: 'u1',
		}),
	];

	it('prefers third-party resolution over the (search-time) entityId', () => {
		// `entityId` is a search-time id that never matches a tile.
		expect(
			resolveTileForFocus('search-uuid-1', CalendarEntityType.None, events, {
				thirdPartyType: 'google',
				thirdPartyId: 'gp-evt-99',
				thirdPartyUserId: 'u1',
			})
		).toBe('s_7_aaa_bbb');
	});

	it('falls back to entity-ID resolution when no tile matches the third-party ref', () => {
		const result = resolveTileForFocus(
			's_7_aaa_bbb',
			CalendarEntityType.SubcalendarEvent,
			events,
			{ thirdPartyId: 'does-not-exist' }
		);
		expect(result).toBe('s_7_aaa_bbb');
	});

	it('keeps classic behavior untouched when no third-party ref is supplied', () => {
		expect(
			resolveTileForFocus('s_7_aaa_bbb', CalendarEntityType.SubcalendarEvent, events)
		).toBe('s_7_aaa_bbb');
		expect(
			resolveTileForFocus('zzz_zzz_zzz_zzz', CalendarEntityType.SubcalendarEvent, events)
		).toBeNull();
	});

	it('returns null when neither the third-party ref nor the entityId matches', () => {
		expect(
			resolveTileForFocus('search-uuid-1', CalendarEntityType.SubcalendarEvent, events, {
				thirdPartyId: 'does-not-exist',
			})
		).toBeNull();
	});
});
