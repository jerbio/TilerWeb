import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  findEventDate,
  type SubCalEventLookupFn,
  type CalEventLookupFn,
} from './eventDateLookup';
import { CalendarEntityType } from '@/core/common/components/calendar/calendarRequestContext';

// ── Tests ──────────────────────────────────────────────────────

describe('findEventDate', () => {
  let mockSubCalLookup: ReturnType<typeof vi.fn<SubCalEventLookupFn>>;
  let mockCalLookup: ReturnType<typeof vi.fn<CalEventLookupFn>>;

  beforeEach(() => {
    mockSubCalLookup = vi.fn<SubCalEventLookupFn>();
    mockCalLookup = vi.fn<CalEventLookupFn>();
  });

  // ── SubcalendarEvent (direct lookup) ───────────────────────

  it('returns start date for a SubcalendarEvent', async () => {
    const targetStart = new Date('2026-03-15T09:00:00Z').getTime();
    mockSubCalLookup.mockResolvedValue({ start: targetStart });

    const result = await findEventDate({
      entityId: 'aaa_bbb_111_222',
      entityType: CalendarEntityType.SubcalendarEvent,
      lookupSubCalEvent: mockSubCalLookup,
      lookupCalEvent: mockCalLookup,
    });

    expect(result).toBe(targetStart);
    expect(mockSubCalLookup).toHaveBeenCalledWith('aaa_bbb_111_222');
    expect(mockCalLookup).not.toHaveBeenCalled();
  });

  it('returns null when SubcalendarEvent lookup returns null', async () => {
    mockSubCalLookup.mockResolvedValue(null);

    const result = await findEventDate({
      entityId: 'zzz_zzz_zzz_zzz',
      entityType: CalendarEntityType.SubcalendarEvent,
      lookupSubCalEvent: mockSubCalLookup,
      lookupCalEvent: mockCalLookup,
    });

    expect(result).toBeNull();
  });

  // ── CalendarEvent (lookup → earliest subEvent) ─────────────

  it('returns earliest subEvent start date for a CalendarEvent', async () => {
    const earlyStart = new Date('2026-03-15T08:00:00Z').getTime();
    const lateStart = new Date('2026-03-15T14:00:00Z').getTime();

    mockCalLookup.mockResolvedValue({
      start: new Date('2026-03-15T00:00:00Z').getTime(), // parent range start
      subEvents: [
        { id: 'aaa_bbb_111_222', start: lateStart },
        { id: 'aaa_bbb_333_444', start: earlyStart },
      ],
    });

    const result = await findEventDate({
      entityId: 'aaa_bbb_0_0',
      entityType: CalendarEntityType.CalendarEvent,
      lookupSubCalEvent: mockSubCalLookup,
      lookupCalEvent: mockCalLookup,
    });

    expect(result).toBe(earlyStart);
    expect(mockCalLookup).toHaveBeenCalledWith('aaa_bbb_0_0');
    expect(mockSubCalLookup).not.toHaveBeenCalled();
  });

  it('falls back to CalendarEvent start when subEvents is empty', async () => {
    const parentStart = new Date('2026-03-15T00:00:00Z').getTime();
    mockCalLookup.mockResolvedValue({
      start: parentStart,
      subEvents: [],
    });

    const result = await findEventDate({
      entityId: 'aaa_bbb_0_0',
      entityType: CalendarEntityType.CalendarEvent,
      lookupSubCalEvent: mockSubCalLookup,
      lookupCalEvent: mockCalLookup,
    });

    expect(result).toBe(parentStart);
  });

  it('returns null when CalendarEvent lookup returns null', async () => {
    mockCalLookup.mockResolvedValue(null);

    const result = await findEventDate({
      entityId: 'zzz_zzz_0_0',
      entityType: CalendarEntityType.CalendarEvent,
      lookupSubCalEvent: mockSubCalLookup,
      lookupCalEvent: mockCalLookup,
    });

    expect(result).toBeNull();
  });

  // ── Non-focusable entity types ─────────────────────────

  it('returns null for RestrictionProfile without calling any lookup', async () => {
    const result = await findEventDate({
      entityId: 'some-restriction',
      entityType: CalendarEntityType.RestrictionProfile,
      lookupSubCalEvent: mockSubCalLookup,
      lookupCalEvent: mockCalLookup,
    });

    expect(result).toBeNull();
    expect(mockSubCalLookup).not.toHaveBeenCalled();
    expect(mockCalLookup).not.toHaveBeenCalled();
  });

  it('returns null for None without calling any lookup', async () => {
    const result = await findEventDate({
      entityId: 'whatever',
      entityType: CalendarEntityType.None,
      lookupSubCalEvent: mockSubCalLookup,
      lookupCalEvent: mockCalLookup,
    });

    expect(result).toBeNull();
    expect(mockSubCalLookup).not.toHaveBeenCalled();
    expect(mockCalLookup).not.toHaveBeenCalled();
  });

  // ── Error handling ─────────────────────────────────────────

  it('returns null when SubcalendarEvent lookup throws', async () => {
    mockSubCalLookup.mockRejectedValue(new Error('Network error'));

    const result = await findEventDate({
      entityId: 'aaa_bbb_111_222',
      entityType: CalendarEntityType.SubcalendarEvent,
      lookupSubCalEvent: mockSubCalLookup,
      lookupCalEvent: mockCalLookup,
    });

    expect(result).toBeNull();
  });

  it('returns null when CalendarEvent lookup throws', async () => {
    mockCalLookup.mockRejectedValue(new Error('Network error'));

    const result = await findEventDate({
      entityId: 'aaa_bbb_0_0',
      entityType: CalendarEntityType.CalendarEvent,
      lookupSubCalEvent: mockSubCalLookup,
      lookupCalEvent: mockCalLookup,
    });

    expect(result).toBeNull();
  });

  // ── CalendarEvent with single subEvent ─────────────────────

  it('handles CalendarEvent with a single subEvent', async () => {
    const subStart = new Date('2026-03-15T10:00:00Z').getTime();
    mockCalLookup.mockResolvedValue({
      start: new Date('2026-03-15T00:00:00Z').getTime(),
      subEvents: [{ id: 'aaa_bbb_111_222', start: subStart }],
    });

    const result = await findEventDate({
      entityId: 'aaa_bbb_0_0',
      entityType: CalendarEntityType.CalendarEvent,
      lookupSubCalEvent: mockSubCalLookup,
      lookupCalEvent: mockCalLookup,
    });

    expect(result).toBe(subStart);
  });
});
