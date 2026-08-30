import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, setupUser, waitFor } from '@/test/test-utils';
import { ThemeProvider } from 'styled-components';
import { lightTheme } from '@/core/theme/light';
import { SubCalendarEvent } from '@/core/common/types/schedule';
import { Actions } from '@/core/constants/enums';
import {
	CalendarEntityType,
	CalendarRequestType,
} from '@/core/common/components/calendar/calendarRequestContext';
import SubEventsSection from '../SubEventsSection';

// ── Mocks ──

const mockGetSubEvents = vi.fn();
vi.mock('@/services', () => ({
	scheduleService: {
		getSubEventsOfCalendar: (...args: unknown[]) => mockGetSubEvents(...args),
	},
}));

const mockDispatch = vi.fn();
vi.mock('@/core/common/components/calendar/CalendarRequestProvider', () => ({
	useOptionalCalendarDispatch: () => mockDispatch,
}));

vi.mock('react-i18next', () => ({
	useTranslation: () => ({
		t: (key: string, opts?: Record<string, unknown>) =>
			opts && typeof opts.count !== 'undefined' ? `${key} ${opts.count}` : key,
		i18n: { language: 'en' },
	}),
}));

// ── Test data ──

const BASE = Date.UTC(2025, 0, 6, 9, 0); // Mon Jan 6 2025, 09:00 UTC

function makeSub(id: string, overrides: Partial<SubCalendarEvent> = {}): SubCalendarEvent {
	const start = overrides.start ?? BASE;
	return {
		id,
		start,
		end: start + 45 * 60000,
		name: `sub-${id}`,
		...overrides,
	} as SubCalendarEvent;
}

function makePage(count: number, startId = 0): SubCalendarEvent[] {
	return Array.from({ length: count }, (_, i) =>
		makeSub(`s_${startId + i}`, { start: BASE + (startId + i) * 3600000 })
	);
}

function renderSection(props?: { eventId?: string; splitCount?: number | null }) {
	return render(
		<ThemeProvider theme={lightTheme}>
			<SubEventsSection
				eventId={props?.eventId ?? 'root123_7_0_0'}
				splitCount={props?.splitCount ?? null}
			/>
		</ThemeProvider>
	);
}

beforeEach(() => {
	vi.clearAllMocks();
});

// ── Bootstrap ──

describe('SubEventsSection bootstrap', () => {
	it('shows a skeleton while the first page is loading', async () => {
		let resolve!: (v: SubCalendarEvent[]) => void;
		mockGetSubEvents.mockReturnValueOnce(
			new Promise<SubCalendarEvent[]>((r) => {
				resolve = r;
			})
		);
		renderSection();
		expect(screen.getByTestId('sub-events-skeleton')).toBeInTheDocument();

		resolve(makePage(3));
		await waitFor(() =>
			expect(screen.queryByTestId('sub-events-skeleton')).not.toBeInTheDocument()
		);
	});

	it('requests the bootstrap page with ProximityToNow + batch 20 and the normalized id', async () => {
		mockGetSubEvents.mockResolvedValueOnce(makePage(3));
		renderSection({ eventId: 'abc_1_2_3' });
		await waitFor(() => expect(mockGetSubEvents).toHaveBeenCalled());
		expect(mockGetSubEvents).toHaveBeenCalledWith('abc_7_0_0', {
			batchSize: 20,
			orderingEngine: 'ProximityToNow',
		});
	});

	it('renders a row per sub-event after the bootstrap resolves', async () => {
		mockGetSubEvents.mockResolvedValueOnce(makePage(3));
		renderSection();
		await waitFor(() => expect(screen.getByTestId('sub-event-row-s_0')).toBeInTheDocument());
		expect(screen.getByTestId('sub-event-row-s_1')).toBeInTheDocument();
		expect(screen.getByTestId('sub-event-row-s_2')).toBeInTheDocument();
	});

	it('shows the end chip (no load-more) when the bootstrap returns a short page', async () => {
		mockGetSubEvents.mockResolvedValueOnce(makePage(3));
		renderSection();
		await waitFor(() => expect(screen.getByTestId('sub-events-end')).toBeInTheDocument());
		expect(screen.queryByTestId('sub-events-load-more')).not.toBeInTheDocument();
	});

	it('renders the plain title without a count', async () => {
		mockGetSubEvents.mockResolvedValueOnce(makePage(3));
		renderSection({ splitCount: 37 });
		await waitFor(() => expect(screen.getByTestId('sub-event-row-s_0')).toBeInTheDocument());
		expect(screen.getByText('calendarEvent.edit.subEvents.title')).toBeInTheDocument();
		expect(
			screen.queryByText('calendarEvent.edit.subEvents.titleWithCount 37')
		).not.toBeInTheDocument();
	});
});

// ── Continuation paging ──

describe('SubEventsSection continuation', () => {
	it('shows a load-more control when the bootstrap fills a full page', async () => {
		mockGetSubEvents.mockResolvedValueOnce(makePage(20));
		renderSection();
		await waitFor(() => expect(screen.getByTestId('sub-events-load-more')).toBeInTheDocument());
	});

	it('loads the next page with Id engine + afterSubEventId of the last row, and appends', async () => {
		mockGetSubEvents
			.mockResolvedValueOnce(makePage(20)) // s_0..s_19
			.mockResolvedValueOnce(makePage(5, 20)); // s_20..s_24
		const user = setupUser();
		renderSection();

		await waitFor(() => expect(screen.getByTestId('sub-events-load-more')).toBeInTheDocument());
		await user.click(screen.getByTestId('sub-events-load-more'));

		await waitFor(() => expect(screen.getByTestId('sub-event-row-s_24')).toBeInTheDocument());
		expect(mockGetSubEvents).toHaveBeenLastCalledWith('root123_7_0_0', {
			batchSize: 20,
			orderingEngine: 'Id',
			afterSubEventId: 's_19',
		});
		// original rows still present (appended, not replaced)
		expect(screen.getByTestId('sub-event-row-s_0')).toBeInTheDocument();
		// short second page → end chip now shown
		expect(screen.getByTestId('sub-events-end')).toBeInTheDocument();
	});
});

// ── Navigate-only ──

describe('SubEventsSection ordering & dedupe', () => {
	function rowIdsInOrder(container: HTMLElement): string[] {
		return Array.from(container.querySelectorAll('[data-testid^="sub-event-row-"]')).map(
			(el) => el.getAttribute('data-testid') ?? ''
		);
	}

	it('renders sessions ordered by start time regardless of fetch order', async () => {
		mockGetSubEvents.mockResolvedValueOnce([
			makeSub('s_b', { start: BASE + 7200000 }),
			makeSub('s_a', { start: BASE }),
			makeSub('s_c', { start: BASE + 3600000 }),
		]);
		const { container } = renderSection();
		await waitFor(() => expect(screen.getByTestId('sub-event-row-s_a')).toBeInTheDocument());
		expect(rowIdsInOrder(container)).toEqual([
			'sub-event-row-s_a',
			'sub-event-row-s_c',
			'sub-event-row-s_b',
		]);
	});

	it('keeps the merged list time-ordered and deduped across continuation pages', async () => {
		mockGetSubEvents
			.mockResolvedValueOnce(makePage(20)) // s_0..s_19 (ascending)
			.mockResolvedValueOnce([
				// overlaps s_19 (duplicate) + out-of-order new items
				makeSub('s_19', { start: BASE + 19 * 3600000 }),
				makeSub('s_21', { start: BASE + 21 * 3600000 }),
				makeSub('s_20', { start: BASE + 20 * 3600000 }),
			]);
		const user = setupUser();
		const { container } = renderSection();

		await waitFor(() => expect(screen.getByTestId('sub-events-load-more')).toBeInTheDocument());
		await user.click(screen.getByTestId('sub-events-load-more'));

		await waitFor(() => expect(screen.getByTestId('sub-event-row-s_21')).toBeInTheDocument());

		// s_19 appears exactly once
		expect(container.querySelectorAll('[data-testid="sub-event-row-s_19"]').length).toBe(1);

		// tail is time-ordered: ... s_19, s_20, s_21
		const ids = rowIdsInOrder(container);
		expect(ids.slice(-3)).toEqual([
			'sub-event-row-s_19',
			'sub-event-row-s_20',
			'sub-event-row-s_21',
		]);
	});
});

describe('SubEventsSection navigation', () => {
	it('dispatches a FocusEvent for the sub-event when a row is activated (no inline edit)', async () => {
		mockGetSubEvents.mockResolvedValueOnce(makePage(3));
		const user = setupUser();
		renderSection();

		await waitFor(() => expect(screen.getByTestId('sub-event-row-s_1')).toBeInTheDocument());
		await user.click(screen.getByTestId('sub-event-row-s_1'));

		expect(mockDispatch).toHaveBeenCalledWith({
			type: CalendarRequestType.FocusEvent,
			entityId: 's_1',
			entityType: CalendarEntityType.SubcalendarEvent,
			actionType: Actions.None,
			startHint: BASE + 3600000,
		});
	});

	it('passes the row start time as startHint so the calendar skips the divergent REST lookup', async () => {
		mockGetSubEvents.mockResolvedValueOnce(makePage(3));
		const user = setupUser();
		renderSection();

		await waitFor(() => expect(screen.getByTestId('sub-event-row-s_2')).toBeInTheDocument());
		await user.click(screen.getByTestId('sub-event-row-s_2'));

		const calls = mockDispatch.mock.calls;
		const call = calls[calls.length - 1][0];
		expect(call).toMatchObject({
			type: CalendarRequestType.FocusEvent,
			entityId: 's_2',
			startHint: BASE + 2 * 3600000,
		});
	});
});

// ── Completed / removed filter ──

describe('SubEventsSection filter', () => {
	it('hides completed and removed sub-events by default and reveals them on toggle', async () => {
		mockGetSubEvents.mockResolvedValueOnce([
			makeSub('s_active', { start: BASE }),
			makeSub('s_done', { start: BASE + 3600000, isComplete: true }),
			makeSub('s_gone', { start: BASE + 7200000, isEnabled: false }),
		]);
		const user = setupUser();
		renderSection();

		await waitFor(() =>
			expect(screen.getByTestId('sub-event-row-s_active')).toBeInTheDocument()
		);
		expect(screen.queryByTestId('sub-event-row-s_done')).not.toBeInTheDocument();
		expect(screen.queryByTestId('sub-event-row-s_gone')).not.toBeInTheDocument();

		await user.click(screen.getByTestId('sub-events-filter-toggle'));

		expect(screen.getByTestId('sub-event-row-s_done')).toBeInTheDocument();
		expect(screen.getByTestId('sub-event-row-s_gone')).toBeInTheDocument();
	});
});

// ── Error handling ──

describe('SubEventsSection error state', () => {
	it('shows an error message and retries the bootstrap on demand', async () => {
		mockGetSubEvents
			.mockRejectedValueOnce(new Error('boom'))
			.mockResolvedValueOnce(makePage(2));
		const user = setupUser();
		renderSection();

		await waitFor(() => expect(screen.getByTestId('sub-events-error')).toBeInTheDocument());
		await user.click(screen.getByText('calendarEvent.edit.subEvents.retry'));

		await waitFor(() => expect(screen.getByTestId('sub-event-row-s_0')).toBeInTheDocument());
	});
});
