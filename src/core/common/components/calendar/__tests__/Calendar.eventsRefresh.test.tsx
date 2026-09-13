/**
 * Tests that verify the open event-info popout automatically reflects
 * updated server data when the `events` prop changes — without requiring
 * the user to re-click the tile.
 *
 * Behaviours covered:
 *  1. Merged event data (e.g. new rsvpStatus) appears in the popout after a
 *     schedule refresh.
 *  2. The popout closes when the selected event is no longer present in the
 *     refreshed event list (deleted / out of view).
 *  3. The popout stays open when the same event is still present in the
 *     refreshed list (regression guard — must not close on background refetch).
 */

import { render, screen } from '@testing-library/react';
import { act } from 'react';
import '@testing-library/jest-dom/vitest';
import dayjs from 'dayjs';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { ThemeProvider } from '@/core/theme/ThemeProvider';
import { CalendarRequestProvider } from '../CalendarRequestProvider';
import { CalendarUIProvider } from '../calendar-ui.provider';
import Calendar from '../calendar';
import { CalendarViewOptions } from '../calendar.types';
import type { StyledEvent } from '../calendar_events';
import type { SubCalendarEvent } from '@/core/common/types/schedule';

// ---------------------------------------------------------------------------
// Hoisted state — lets the CalendarContent mock write captured setters back
// so individual tests can trigger event-selection programmatically.
// ---------------------------------------------------------------------------
const mockSetters = vi.hoisted(
	(): {
		setSelectedEventInfo: ((e: StyledEvent | null) => void) | null;
		setSelectedEvent: ((id: string | null) => void) | null;
	} => ({ setSelectedEventInfo: null, setSelectedEvent: null })
);

// ---------------------------------------------------------------------------
// Shared mocks (mirrors Calendar.test.tsx boilerplate)
// ---------------------------------------------------------------------------

// Skip react-spring animations entirely so useTransition immediately removes
// leaving items from the DOM — without this, the 150ms leave animation keeps
// the old CalendarEventInfo alive and the "closes popout" assertion fails.
vi.mock('@react-spring/web', () => ({
	animated: new Proxy({} as Record<string, string>, { get: (_, tag: string) => tag }),
	a: new Proxy({} as Record<string, string>, { get: (_, tag: string) => tag }),
	useTransition:
		<T,>(items: T[]) =>
		(render: (style: object, item: T) => unknown) =>
			items.map((item) => render({}, item)),
	useSpringRef: () => ({ current: null }),
	useChain: () => {},
	useSpring: () => [{}],
}));

vi.mock('react-i18next', () => ({
	initReactI18next: { type: '3rdParty', init: () => {} },
	useTranslation: () => ({ t: (key: string) => key }),
	Trans: ({ i18nKey }: { i18nKey: string }) => <span>{i18nKey}</span>,
}));

vi.mock('@/core/util/analytics', () => ({
	default: { trackCalendarEvent: vi.fn() },
}));

vi.mock('@/core/common/hooks/useIsMobile', () => ({
	default: () => false,
}));

vi.mock('@/services', () => ({
	scheduleService: { getNewTilePrediction: vi.fn(() => Promise.resolve(null)) },
	userService: { getScheduleProfile: vi.fn(() => Promise.resolve(null)) },
}));

vi.mock('swiper/react', async () => {
	const React = await import('react');
	const Swiper = React.forwardRef<
		{ swiper: { disable: () => void; enable: () => void; slideTo: () => void } },
		{ children?: React.ReactNode }
	>(({ children }, ref) => {
		React.useImperativeHandle(ref, () => ({
			swiper: { disable: () => {}, enable: () => {}, slideTo: () => {} },
		}));
		return React.createElement('div', { 'data-testid': 'mock-swiper' }, children);
	});
	Swiper.displayName = 'MockSwiper';
	return {
		Swiper,
		SwiperSlide: ({ children }: { children?: React.ReactNode }) =>
			React.createElement('div', null, children),
	};
});

vi.mock('../calendar_create_selection', async () => {
	const React = await import('react');
	return {
		default: () => React.createElement('div', { 'data-testid': 'mock-create-selection' }),
	};
});

vi.mock('../create_block', async () => {
	const React = await import('react');
	return {
		default: () => React.createElement('div', { 'data-testid': 'mock-create-block' }),
	};
});

vi.mock('../create_tile', async () => {
	const React = await import('react');
	return {
		default: () => React.createElement('div', { 'data-testid': 'mock-create-tile' }),
	};
});

vi.mock('../calendar_content_dummy', async () => {
	const React = await import('react');
	return {
		default: () => React.createElement('div', { 'data-testid': 'mock-calendar-content-dummy' }),
	};
});

vi.mock('../calendarRequestHandler', () => ({
	createCalendarRequestHandler: () => vi.fn(),
	retryPendingFocus: vi.fn(),
}));

// CalendarModal wraps create-tile/block/selection panels — not under test here.
vi.mock('../modals', async () => {
	const React = await import('react');
	return {
		default: ({ children, open }: { children?: React.ReactNode; open: boolean }) =>
			open
				? React.createElement('div', { 'data-testid': 'mock-calendar-modal' }, children)
				: null,
	};
});

// ---------------------------------------------------------------------------
// CalendarContent mock — captures setSelectedEventInfo / setSelectedEvent so
// tests can open the popout programmatically (simulating a tile click).
// ---------------------------------------------------------------------------
vi.mock('../calendar_content', async () => {
	const React = await import('react');
	return {
		default: (props: {
			setSelectedEventInfo: (e: StyledEvent | null) => void;
			setSelectedEvent: (id: string | null) => void;
		}) => {
			mockSetters.setSelectedEventInfo = props.setSelectedEventInfo;
			mockSetters.setSelectedEvent = props.setSelectedEvent;
			return React.createElement('div', { 'data-testid': 'mock-calendar-content' });
		},
	};
});

// ---------------------------------------------------------------------------
// CalendarEventInfo mock — renders a div with data attributes so tests can
// assert on which event data the popout is currently showing.
// Returns null when event is null so the popout is absent from the DOM.
// ---------------------------------------------------------------------------
vi.mock('../calendar_event_info', async () => {
	const React = await import('react');
	return {
		default: (props: { event: SubCalendarEvent | null }) => {
			if (!props.event) return null;
			return React.createElement('div', {
				'data-testid': 'mock-calendar-event-info',
				'data-event-id': props.event.id,
				'data-rsvp-status': props.event.rsvpStatus ?? '',
				'data-event-name': props.event.name ?? '',
			});
		},
	};
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const viewOptions: CalendarViewOptions = {
	width: 720,
	startDay: dayjs('2026-05-05'),
	daysInView: 3,
};

/** Wrap a raw SubCalendarEvent in the minimal StyledEvent shape. */
function makeStyledEvent(event: SubCalendarEvent): StyledEvent {
	return {
		...event,
		key: event.id,
		properties: {
			eventChainKey: event.id,
			eventChainIndex: 0,
			eventChainLength: 1,
			startHourFraction: 9,
			endHourFraction: 10,
		},
		springStyles: { x: 0, y: 0, width: 200, height: 60 },
	};
}

function Wrapper({
	events,
	refetchEvents = vi.fn(),
}: {
	events: SubCalendarEvent[];
	refetchEvents?: () => Promise<void>;
}) {
	return (
		<ThemeProvider defaultTheme="light">
			<CalendarRequestProvider>
				<CalendarUIProvider demoMode={false}>
					<Calendar
						events={events}
						eventsLoading={false}
						viewRef={{ current: null }}
						viewOptions={viewOptions}
						setViewOptions={vi.fn()}
						refetchEvents={refetchEvents}
					/>
				</CalendarUIProvider>
			</CalendarRequestProvider>
		</ThemeProvider>
	);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Calendar — selectedEventInfo sync on events refresh', () => {
	beforeEach(() => {
		mockSetters.setSelectedEventInfo = null;
		mockSetters.setSelectedEvent = null;
	});

	it('merges updated event fields into the open popout after a schedule refresh', () => {
		const initial: SubCalendarEvent = {
			id: 'evt-rsvp-1',
			start: 1714809600000,
			end: 1714813200000,
			name: 'Team Standup',
			rsvpStatus: 'Accepted',
		};

		const { rerender } = render(<Wrapper events={[initial]} />);

		// Simulate the user clicking the tile to open the popout
		act(() => {
			mockSetters.setSelectedEventInfo!(makeStyledEvent(initial));
			mockSetters.setSelectedEvent!(initial.id);
		});

		expect(screen.getByTestId('mock-calendar-event-info')).toHaveAttribute(
			'data-rsvp-status',
			'Accepted'
		);

		// Schedule refresh returns the same event with a new rsvpStatus
		const updated: SubCalendarEvent = { ...initial, rsvpStatus: 'Declined' };
		rerender(<Wrapper events={[updated]} />);

		// Popout updates automatically — no re-click required
		expect(screen.getByTestId('mock-calendar-event-info')).toHaveAttribute(
			'data-rsvp-status',
			'Declined'
		);
	});

	it('closes the popout when the selected event is absent from the refreshed event list', () => {
		const event: SubCalendarEvent = {
			id: 'evt-deleted-1',
			start: 1714809600000,
			end: 1714813200000,
			name: 'Meeting to delete',
		};

		const { rerender } = render(<Wrapper events={[event]} />);

		act(() => {
			mockSetters.setSelectedEventInfo!(makeStyledEvent(event));
			mockSetters.setSelectedEvent!(event.id);
		});

		expect(screen.getByTestId('mock-calendar-event-info')).toBeInTheDocument();

		// Event is deleted — server returns list without it
		rerender(<Wrapper events={[]} />);

		expect(screen.queryByTestId('mock-calendar-event-info')).not.toBeInTheDocument();
	});

	it('keeps the popout open when the event is still present after a background refetch', () => {
		const event: SubCalendarEvent = {
			id: 'evt-stable-1',
			start: 1714809600000,
			end: 1714813200000,
			name: 'Workshop',
			rsvpStatus: 'Accepted',
		};

		const { rerender } = render(<Wrapper events={[event]} />);

		act(() => {
			mockSetters.setSelectedEventInfo!(makeStyledEvent(event));
			mockSetters.setSelectedEvent!(event.id);
		});

		expect(screen.getByTestId('mock-calendar-event-info')).toBeInTheDocument();

		// Background refetch returns the same event — popout must stay open
		rerender(<Wrapper events={[{ ...event }]} />);

		expect(screen.getByTestId('mock-calendar-event-info')).toBeInTheDocument();
		expect(screen.getByTestId('mock-calendar-event-info')).toHaveAttribute(
			'data-event-id',
			event.id
		);
	});

	it('reflects a name change in the popout after a schedule refresh', () => {
		const event: SubCalendarEvent = {
			id: 'evt-rename-1',
			start: 1714809600000,
			end: 1714813200000,
			name: 'Old Name',
		};

		const { rerender } = render(<Wrapper events={[event]} />);

		act(() => {
			mockSetters.setSelectedEventInfo!(makeStyledEvent(event));
			mockSetters.setSelectedEvent!(event.id);
		});

		expect(screen.getByTestId('mock-calendar-event-info')).toHaveAttribute(
			'data-event-name',
			'Old Name'
		);

		rerender(<Wrapper events={[{ ...event, name: 'New Name' }]} />);

		expect(screen.getByTestId('mock-calendar-event-info')).toHaveAttribute(
			'data-event-name',
			'New Name'
		);
	});
});
