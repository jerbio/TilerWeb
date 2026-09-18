import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import dayjs from 'dayjs';
import {
	createCalendarRequestHandler,
	retryPendingFocus,
	type CalendarRequestHandlerDeps,
	type PendingFocus,
} from '../calendarRequestHandler';
import {
	CalendarEntityType,
	CalendarRequestType,
	CalendarRequestStatus,
} from '../calendarRequestContext';
import { Actions } from '@/core/constants/enums';
import { StyledEvent } from '../calendar_events';
import { SubCalendarEvent } from '@/core/common/types/schedule';

// ── Mocks ──────────────────────────────────────────────────────────

const mockLookupSubCalendarEventById = vi.fn();
const mockLookupCalendarEventById = vi.fn();
const mockGetSubEventsOfCalendar = vi.fn();

vi.mock('@/services', () => ({
	scheduleService: {
		lookupSubCalendarEventById: (...args: unknown[]) => mockLookupSubCalendarEventById(...args),
		lookupCalendarEventById: (...args: unknown[]) => mockLookupCalendarEventById(...args),
		getSubEventsOfCalendar: (...args: unknown[]) => mockGetSubEventsOfCalendar(...args),
	},
}));

// ── Helpers ────────────────────────────────────────────────────────

function makeStyled(
	id: string,
	start: number,
	isViable = true,
	metadata: Record<string, unknown> = {}
): StyledEvent {
	return { id, start, isViable, ...metadata } as unknown as StyledEvent;
}

function makeDeps(overrides: Partial<CalendarRequestHandlerDeps> = {}): CalendarRequestHandlerDeps {
	return {
		styledEventsRef: { current: [] },
		pendingFocusRef: { current: null } as { current: PendingFocus | null },
		contentContainerRef: {
			current: {
				scrollTo: vi.fn(),
				clientHeight: 600,
				scrollTop: 0,
			} as unknown as HTMLDivElement,
		},
		focusTimeoutRef: { current: null },
		focusRetryTimeoutRef: { current: null },
		eventsRef: { current: [] as SubCalendarEvent[] },
		allowEventLookup: true,
		setShowNonViableEvents: vi.fn(),
		setSelectedEventInfo: vi.fn(),
		setSelectedEvent: vi.fn(),
		setViewOptions: vi.fn(),
		setFocusedEventId: vi.fn(),
		bottomInsetPxRef: { current: 0 },
		...overrides,
	};
}

beforeEach(() => {
	vi.clearAllMocks();
});

// ── startHint short-circuit ────────────────────────────────────────

describe('createCalendarRequestHandler — startHint', () => {
	const HINT_MS = Date.UTC(2026, 7, 18, 12, 0); // 2026-08-18

	it('navigates using startHint without a REST lookup when the tile is off-screen', () => {
		const deps = makeDeps();
		const onResult = vi.fn();
		const handler = createCalendarRequestHandler(deps);

		handler({
			request: {
				type: CalendarRequestType.FocusEvent,
				entityId: 'root_7_aaa_bbb',
				entityType: CalendarEntityType.SubcalendarEvent,
				actionType: Actions.None,
				startHint: HINT_MS,
			},
			onResult,
		});

		// The divergent REST lookup must be skipped entirely.
		expect(mockLookupSubCalendarEventById).not.toHaveBeenCalled();

		// A pending focus is queued to retry once the new day's tiles render.
		expect(deps.pendingFocusRef.current).toEqual(
			expect.objectContaining({ entityId: 'root_7_aaa_bbb' })
		);

		// The caller is told navigation is under way.
		expect(onResult).toHaveBeenCalledWith({
			status: CalendarRequestStatus.Navigating,
			entityId: 'root_7_aaa_bbb',
		});

		// setViewOptions is driven to the hint's day.
		const updater = (deps.setViewOptions as ReturnType<typeof vi.fn>).mock.calls[0][0];
		const next = updater({ startDay: dayjs('2020-01-01'), daysInView: 7 });
		expect(next.startDay.format('YYYY-MM-DD')).toBe(
			dayjs(HINT_MS).startOf('day').format('YYYY-MM-DD')
		);
	});

	it('falls back to the REST lookup when no startHint is supplied', () => {
		mockLookupSubCalendarEventById.mockResolvedValue({ start: HINT_MS, isEnabled: true });
		const deps = makeDeps();
		const handler = createCalendarRequestHandler(deps);

		handler({
			request: {
				type: CalendarRequestType.FocusEvent,
				entityId: 'root_7_aaa_bbb',
				entityType: CalendarEntityType.SubcalendarEvent,
				actionType: Actions.None,
			},
			onResult: vi.fn(),
		});

		expect(mockLookupSubCalendarEventById).toHaveBeenCalledWith('root_7_aaa_bbb');
	});

	it('focuses immediately (ignoring startHint) when the tile is already in view', () => {
		const tile = makeStyled('root_7_aaa_bbb', HINT_MS);
		const deps = makeDeps({ styledEventsRef: { current: [tile] } });
		const onResult = vi.fn();
		const handler = createCalendarRequestHandler(deps);

		handler({
			request: {
				type: CalendarRequestType.FocusEvent,
				entityId: 'root_7_aaa_bbb',
				entityType: CalendarEntityType.SubcalendarEvent,
				actionType: Actions.None,
				startHint: HINT_MS,
			},
			onResult,
		});

		expect(deps.setViewOptions).not.toHaveBeenCalled();
		expect(onResult).toHaveBeenCalledWith({
			status: CalendarRequestStatus.Found,
			entityId: 'root_7_aaa_bbb',
		});
	});
});

// ── retryPendingFocus — bounded re-arm ─────────────────────────────

describe('retryPendingFocus — bounded re-arm', () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});
	afterEach(() => {
		vi.useRealTimers();
	});

	it('re-arms instead of giving up when the tile has not rendered yet', () => {
		const onResult = vi.fn();
		const deps = makeDeps();
		deps.pendingFocusRef.current = {
			entityId: 'x_7_a_b',
			entityType: CalendarEntityType.SubcalendarEvent,
			onResult,
		};

		retryPendingFocus(deps);

		// It does NOT prematurely report NotFound.
		expect(onResult).not.toHaveBeenCalled();
		// The pending focus is retained (with an attempt bump) and a retry is scheduled.
		expect(deps.pendingFocusRef.current).not.toBeNull();
		expect(deps.focusRetryTimeoutRef?.current).not.toBeNull();
	});

	it('focuses the tile when it renders on a later retry', () => {
		const onResult = vi.fn();
		const deps = makeDeps();
		deps.pendingFocusRef.current = {
			entityId: 'x_7_a_b',
			entityType: CalendarEntityType.SubcalendarEvent,
			onResult,
		};

		retryPendingFocus(deps); // miss → re-arm

		// Tile renders before the next scheduled retry fires.
		deps.styledEventsRef.current = [makeStyled('x_7_a_b', Date.UTC(2026, 7, 18, 9, 0))];
		vi.advanceTimersByTime(1000);

		expect(onResult).toHaveBeenCalledWith({
			status: CalendarRequestStatus.Found,
			entityId: 'x_7_a_b',
		});
		expect(deps.pendingFocusRef.current).toBeNull();
		expect(
			(deps.contentContainerRef.current as unknown as { scrollTo: ReturnType<typeof vi.fn> })
				.scrollTo
		).toHaveBeenCalled();
	});

	it('reports NotFound only after exhausting all retries', () => {
		const onResult = vi.fn();
		const deps = makeDeps();
		deps.pendingFocusRef.current = {
			entityId: 'x_7_a_b',
			entityType: CalendarEntityType.SubcalendarEvent,
			onResult,
		};

		retryPendingFocus(deps);
		// Drive every scheduled re-arm to completion; the tile never appears.
		vi.advanceTimersByTime(5000);

		expect(onResult).toHaveBeenCalledWith({
			status: CalendarRequestStatus.NotFound,
			entityId: 'x_7_a_b',
		});
		expect(deps.pendingFocusRef.current).toBeNull();
	});

	it('does nothing when there is no pending focus', () => {
		const deps = makeDeps();
		expect(() => retryPendingFocus(deps)).not.toThrow();
		expect(deps.setViewOptions).not.toHaveBeenCalled();
	});
});

// ── third-party metadata merge ─────────────────────────────────────

describe('createCalendarRequestHandler — third-party metadata', () => {
	const TILE_MS = Date.UTC(2026, 7, 18, 9, 0);
	const META = {
		thirdPartyType: 'google',
		thirdPartyId: 'gp-evt-99',
		thirdPartyUserId: 'golfer@gmail.com',
	};

	it('merges supplied third-party metadata into the selected event info', () => {
		const tile = makeStyled('x_7_a_b', TILE_MS);
		const deps = makeDeps({ styledEventsRef: { current: [tile] } });
		const onResult = vi.fn();
		const handler = createCalendarRequestHandler(deps);

		handler({
			request: {
				type: CalendarRequestType.FocusEvent,
				entityId: 'x_7_a_b',
				entityType: CalendarEntityType.SubcalendarEvent,
				actionType: Actions.None,
				startHint: TILE_MS,
				...META,
			},
			onResult,
		});

		// In-view tile → immediate Found, no navigation.
		expect(deps.setViewOptions).not.toHaveBeenCalled();
		expect(onResult).toHaveBeenCalledWith({
			status: CalendarRequestStatus.Found,
			entityId: 'x_7_a_b',
		});

		// The selected event info (what CalendarEventInfo renders) carries
		// the provider routing metadata on top of the tile's own values.
		const selected = (deps.setSelectedEventInfo as ReturnType<typeof vi.fn>).mock
			.calls[0][0] as StyledEvent;
		expect(selected).toMatchObject({
			id: 'x_7_a_b',
			thirdPartyType: 'google',
			thirdPartyId: 'gp-evt-99',
			thirdPartyUserId: 'golfer@gmail.com',
		});

		// The source tile object is never mutated.
		expect(tile.thirdPartyType).toBeUndefined();
	});

	it('passes the tile through unchanged when no metadata is supplied', () => {
		const tile = makeStyled('x_7_a_b', TILE_MS);
		const deps = makeDeps({ styledEventsRef: { current: [tile] } });
		const handler = createCalendarRequestHandler(deps);

		handler({
			request: {
				type: CalendarRequestType.FocusEvent,
				entityId: 'x_7_a_b',
				entityType: CalendarEntityType.SubcalendarEvent,
				actionType: Actions.None,
			},
			onResult: vi.fn(),
		});

		// No metadata → the exact same tile reference is selected (identity
		// preserved, so downstream memoization is unaffected).
		const selected = (deps.setSelectedEventInfo as ReturnType<typeof vi.fn>).mock
			.calls[0][0] as StyledEvent;
		expect(selected).toBe(tile);
	});

	it('carries third-party metadata through navigate-and-retry', () => {
		const deps = makeDeps();
		const onResult = vi.fn();
		const handler = createCalendarRequestHandler(deps);

		handler({
			request: {
				type: CalendarRequestType.FocusEvent,
				entityId: 'x_7_a_b',
				entityType: CalendarEntityType.SubcalendarEvent,
				actionType: Actions.None,
				startHint: TILE_MS,
				...META,
			},
			onResult,
		});

		// Off-screen tile → navigation + queued pending focus with metadata.
		expect(deps.pendingFocusRef.current).toEqual(
			expect.objectContaining({
				entityId: 'x_7_a_b',
				thirdPartyType: 'google',
				thirdPartyId: 'gp-evt-99',
				thirdPartyUserId: 'golfer@gmail.com',
			})
		);

		// Tile renders after navigation — the retry must still merge metadata.
		deps.styledEventsRef.current = [makeStyled('x_7_a_b', TILE_MS)];
		retryPendingFocus(deps);

		// The navigation step first cleared the selection (null); the retry's
		// focus is the most recent call.
		const setInfo = deps.setSelectedEventInfo as ReturnType<typeof vi.fn>;
		const selected = setInfo.mock.calls[setInfo.mock.calls.length - 1]?.[0] as StyledEvent;
		expect(selected).toMatchObject({
			id: 'x_7_a_b',
			thirdPartyType: 'google',
			thirdPartyId: 'gp-evt-99',
			thirdPartyUserId: 'golfer@gmail.com',
		});
		expect(onResult).toHaveBeenCalledWith({
			status: CalendarRequestStatus.Found,
			entityId: 'x_7_a_b',
		});
	});
});

// ── third-party focus resolution (search-time entityId → tile) ─────

describe('createCalendarRequestHandler — third-party focus resolution', () => {
	const TILE_MS = Date.UTC(2026, 7, 18, 9, 0);
	const META = {
		thirdPartyType: 'google',
		thirdPartyId: 'gp-evt-99',
		thirdPartyUserId: 'golfer@gmail.com',
	};
	// The SearchBar dispatches a search-time `entityId` that never matches a
	// rendered grid tile — the tile must be found via the provider metadata.
	const SEARCH_ID = 'search-uuid-123';

	it('resolves and focuses a tile by thirdPartyId when the entityId never matches', () => {
		const tile = makeStyled('real_7_aaa_bbb', TILE_MS, true, { ...META });
		const deps = makeDeps({ styledEventsRef: { current: [tile] } });
		const onResult = vi.fn();
		const handler = createCalendarRequestHandler(deps);

		handler({
			request: {
				type: CalendarRequestType.FocusEvent,
				entityId: SEARCH_ID,
				entityType: CalendarEntityType.SubcalendarEvent,
				actionType: Actions.None,
				startHint: TILE_MS,
				...META,
			},
			onResult,
		});

		// The tile is in view → immediate Found (no navigation, no retry queue).
		expect(deps.setViewOptions).not.toHaveBeenCalled();
		expect(deps.pendingFocusRef.current).toBeNull();
		expect(onResult).toHaveBeenCalledWith({
			status: CalendarRequestStatus.Found,
			entityId: SEARCH_ID,
		});

		// The focused tile is the third-party one, with routing metadata merged.
		const setInfo = deps.setSelectedEventInfo as ReturnType<typeof vi.fn>;
		const selected = setInfo.mock.calls[setInfo.mock.calls.length - 1]?.[0] as StyledEvent;
		expect(selected).toMatchObject({
			id: 'real_7_aaa_bbb',
			thirdPartyType: 'google',
			thirdPartyId: 'gp-evt-99',
			thirdPartyUserId: 'golfer@gmail.com',
		});
	});

	it('falls back to entity-ID resolution when no tile matches the third-party metadata', () => {
		const tile = makeStyled('real_7_aaa_bbb', TILE_MS, true, {
			thirdPartyType: 'google',
			thirdPartyId: 'some-other-event',
		});
		const deps = makeDeps({ styledEventsRef: { current: [tile] } });
		const onResult = vi.fn();
		const handler = createCalendarRequestHandler(deps);

		handler({
			request: {
				type: CalendarRequestType.FocusEvent,
				entityId: 'real_7_aaa_bbb',
				entityType: CalendarEntityType.SubcalendarEvent,
				actionType: Actions.None,
				startHint: TILE_MS,
				...META,
			},
			onResult,
		});

		// Third-party ref misses → classic resolution finds the tile by id.
		expect(onResult).toHaveBeenCalledWith({
			status: CalendarRequestStatus.Found,
			entityId: 'real_7_aaa_bbb',
		});
	});

	it('picks the earliest tile when several tiles share the third-party id', () => {
		const second = makeStyled('real_7_ccc_ddd', TILE_MS + 24 * 60 * 60 * 1000, true, {
			...META,
		});
		const first = makeStyled('real_7_aaa_bbb', TILE_MS, true, { ...META });
		const deps = makeDeps({ styledEventsRef: { current: [second, first] } });
		const onResult = vi.fn();
		const handler = createCalendarRequestHandler(deps);

		handler({
			request: {
				type: CalendarRequestType.FocusEvent,
				entityId: SEARCH_ID,
				entityType: CalendarEntityType.SubcalendarEvent,
				actionType: Actions.None,
				startHint: TILE_MS,
				...META,
			},
			onResult,
		});

		expect(onResult).toHaveBeenCalledWith({
			status: CalendarRequestStatus.Found,
			entityId: SEARCH_ID,
		});
		const setInfo = deps.setSelectedEventInfo as ReturnType<typeof vi.fn>;
		const selected = setInfo.mock.calls[setInfo.mock.calls.length - 1]?.[0] as StyledEvent;
		expect(selected?.id).toBe('real_7_aaa_bbb');
	});

	it('keeps Tiler entityId behavior unchanged when no metadata is supplied', () => {
		const tile = makeStyled('real_7_aaa_bbb', TILE_MS);
		const deps = makeDeps({ styledEventsRef: { current: [tile] } });
		const onResult = vi.fn();
		const handler = createCalendarRequestHandler(deps);

		handler({
			request: {
				type: CalendarRequestType.FocusEvent,
				entityId: 'real_7_aaa_bbb',
				entityType: CalendarEntityType.SubcalendarEvent,
				actionType: Actions.None,
				startHint: TILE_MS,
			},
			onResult,
		});

		expect(onResult).toHaveBeenCalledWith({
			status: CalendarRequestStatus.Found,
			entityId: 'real_7_aaa_bbb',
		});
		const setInfo = deps.setSelectedEventInfo as ReturnType<typeof vi.fn>;
		const selected = setInfo.mock.calls[setInfo.mock.calls.length - 1]?.[0];
		expect(selected).toBe(tile); // identity preserved, no merge
	});
});
// ── retryPendingFocus — third-party metadata ───────────────────────

describe('retryPendingFocus — third-party metadata', () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});
	afterEach(() => {
		vi.useRealTimers();
	});

	it('re-resolves by thirdPartyId after navigation and preserves metadata on re-arm', () => {
		const onResult = vi.fn();
		const deps = makeDeps();
		deps.pendingFocusRef.current = {
			entityId: 'search-uuid-123',
			entityType: CalendarEntityType.SubcalendarEvent,
			onResult,
			thirdPartyType: 'google',
			thirdPartyId: 'gp-evt-99',
			thirdPartyUserId: 'golfer@gmail.com',
		};

		retryPendingFocus(deps); // miss → re-arm

		// Metadata must survive the re-arm so a later retry still resolves.
		expect(deps.pendingFocusRef.current).toEqual(
			expect.objectContaining({
				thirdPartyType: 'google',
				thirdPartyId: 'gp-evt-99',
				thirdPartyUserId: 'golfer@gmail.com',
			})
		);

		// The tile renders with the search-time entityId — only the provider
		// metadata can resolve it.
		deps.styledEventsRef.current = [
			makeStyled('real_7_aaa_bbb', Date.UTC(2026, 7, 18, 9, 0), true, {
				thirdPartyType: 'google',
				thirdPartyId: 'gp-evt-99',
				thirdPartyUserId: 'golfer@gmail.com',
			}),
		];
		vi.advanceTimersByTime(1000);

		expect(onResult).toHaveBeenCalledWith({
			status: CalendarRequestStatus.Found,
			entityId: 'search-uuid-123',
		});
		expect(deps.pendingFocusRef.current).toBeNull();

		const setInfo = deps.setSelectedEventInfo as ReturnType<typeof vi.fn>;
		const selected = setInfo.mock.calls[setInfo.mock.calls.length - 1]?.[0] as StyledEvent;
		expect(selected).toMatchObject({
			id: 'real_7_aaa_bbb',
			thirdPartyId: 'gp-evt-99',
		});
	});

	it('does not add third-party metadata for pending focuses without it', () => {
		const onResult = vi.fn();
		const deps = makeDeps();
		deps.pendingFocusRef.current = {
			entityId: 'x_7_a_b',
			entityType: CalendarEntityType.SubcalendarEvent,
			onResult,
		};

		retryPendingFocus(deps); // miss → re-arm

		const pending = deps.pendingFocusRef.current as PendingFocus;
		expect(pending.entityId).toBe('x_7_a_b');
		expect(pending).not.toHaveProperty('thirdPartyType');
		expect(pending).not.toHaveProperty('thirdPartyId');
		expect(pending).not.toHaveProperty('thirdPartyUserId');
	});
});
