import { describe, it, expect } from 'vitest';
import {
  extractCalendarEventPrefix,
  resolveEntityToTileId,
  isCalendarEventId,
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
    makeEvent('aaa_bbb_333_444', 500),  // earliest child of aaa_bbb
    makeEvent('aaa_bbb_555_666', 2000),
    makeEvent('xxx_yyy_111_222', 3000),
  ];

  // ── SubcalendarEvent (direct match) ────────────────────────

  it('returns direct match for SubcalendarEvent entityType', () => {
    const result = resolveEntityToTileId('aaa_bbb_111_222', CalendarEntityType.SubcalendarEvent, events);
    expect(result).toBe('aaa_bbb_111_222');
  });

  it('returns null when SubcalendarEvent ID is not found', () => {
    const result = resolveEntityToTileId('zzz_zzz_zzz_zzz', CalendarEntityType.SubcalendarEvent, events);
    expect(result).toBeNull();
  });

  // ── CalendarEvent (prefix match → earliest child) ──────────

  it('resolves CalendarEvent ID to earliest child SubcalendarEvent by start time', () => {
    const result = resolveEntityToTileId('aaa_bbb_0_0', CalendarEntityType.CalendarEvent, events);
    // aaa_bbb_333_444 has start=500 (earliest)
    expect(result).toBe('aaa_bbb_333_444');
  });

  it('returns null when CalendarEvent has no matching children', () => {
    const result = resolveEntityToTileId('zzz_zzz_0_0', CalendarEntityType.CalendarEvent, events);
    expect(result).toBeNull();
  });

  it('resolves CalendarEvent with a single child', () => {
    const result = resolveEntityToTileId('xxx_yyy_0_0', CalendarEntityType.CalendarEvent, events);
    expect(result).toBe('xxx_yyy_111_222');
  });

  it('does not match the CalendarEvent ID itself (ignores _0_0 entries)', () => {
    // If the styledEvents somehow contained a CalendarEvent-shaped ID, skip it
    const eventsWithParent = [
      ...events,
      makeEvent('aaa_bbb_0_0', 100), // this should be excluded from children
    ];
    const result = resolveEntityToTileId('aaa_bbb_0_0', CalendarEntityType.CalendarEvent, eventsWithParent);
    // Should pick the earliest non-CalendarEvent child: aaa_bbb_333_444 (start=500)
    expect(result).toBe('aaa_bbb_333_444');
  });

  // ── RestrictionProfile ─────────────────────────────────────

  it('returns null for RestrictionProfile entityType (not yet supported)', () => {
    const result = resolveEntityToTileId('some-restriction-id', CalendarEntityType.RestrictionProfile, events);
    expect(result).toBeNull();
  });

  // ── None ───────────────────────────────────────────────────

  it('returns null for None entityType', () => {
    const result = resolveEntityToTileId('whatever', CalendarEntityType.None, events);
    expect(result).toBeNull();
  });

  // ── Edge cases ─────────────────────────────────────────────

  it('returns null when events array is empty', () => {
    expect(resolveEntityToTileId('aaa_bbb_0_0', CalendarEntityType.CalendarEvent, [])).toBeNull();
    expect(resolveEntityToTileId('aaa_bbb_111_222', CalendarEntityType.SubcalendarEvent, [])).toBeNull();
  });

  it('handles CalendarEvent with children having equal start times', () => {
    const tied = [
      makeEvent('tt_uu_aaa_bbb', 1000),
      makeEvent('tt_uu_ccc_ddd', 1000),
    ];
    const result = resolveEntityToTileId('tt_uu_0_0', CalendarEntityType.CalendarEvent, tied);
    // Both have same start — should return one of them deterministically (first found)
    expect(result).toBe('tt_uu_aaa_bbb');
  });
});
