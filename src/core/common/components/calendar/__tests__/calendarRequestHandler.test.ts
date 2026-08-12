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

function makeStyled(id: string, start: number, isViable = true): StyledEvent {
	return { id, start, isViable } as unknown as StyledEvent;
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
