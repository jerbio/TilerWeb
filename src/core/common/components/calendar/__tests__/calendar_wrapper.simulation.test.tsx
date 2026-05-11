import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act } from 'react';
import dayjs from 'dayjs';
import { render } from '@/test/test-utils';
import { ThemeProvider } from '@/core/theme/ThemeProvider';
import { CalendarUIProvider } from '../calendar-ui.provider';
import { CalendarRequestProvider } from '../CalendarRequestProvider';
import useSimulationOverlayStore from '@/core/state/simulationOverlayStore';
import fixture from '@/test/fixtures/vibePreviewResponse.json';
import type {
	SimulationDto,
	SimulationScheduleResult,
	VibeRequest,
} from '@/core/common/types/chat';
import { SimulationState } from '@/core/common/types/chat';

// ---------------------------------------------------------------------------
// Mock heavy dependencies — we only care that <Calendar /> receives the
// overlay events when the simulation store is populated. This pins the
// wire-key contract end-to-end through the wrapper.
// ---------------------------------------------------------------------------

const calendarSpy = vi.fn();

vi.mock('@/core/common/components/calendar/calendar', () => ({
	default: (props: { events: unknown[] }) => {
		calendarSpy(props);
		return <div data-testid="calendar-mock">events:{props.events.length}</div>;
	},
}));

vi.mock('@/core/common/hooks/usePrefetchedCalendarEvents', () => ({
	default: () => ({
		events: [],
		loading: false,
		refetchEvents: vi.fn(),
	}),
}));

vi.mock('@/core/common/hooks/useCalendarView', () => ({
	default: () => ({
		// Anchor the visible window on the fixture's events (May 2024) so the
		// diff classifies them as in-window. The wrapper still renders overlay
		// tiles when the window does not match, but using a matching window
		// keeps the test honest about the live data flow.
		viewOptions: {
			startDay: dayjs(1714809600000).startOf('day'),
			daysInView: 7,
		},
		setViewOptions: vi.fn(),
	}),
}));

vi.mock('@/hooks/useScheduleSocket', () => ({
	useScheduleSocket: vi.fn(),
}));

import { CalendarWrapper } from '../calendar_wrapper';

const renderWrapper = () =>
	render(
		<ThemeProvider>
			<CalendarRequestProvider>
				<CalendarUIProvider>
					<CalendarWrapper userId="user-1" width={1024} />
				</CalendarUIProvider>
			</CalendarRequestProvider>
		</ThemeProvider>
	);

describe('CalendarWrapper — simulation overlay wire contract', () => {
	beforeEach(() => {
		calendarSpy.mockClear();
		// Reset store between tests.
		useSimulationOverlayStore.setState({
			inReview: false,
			simulation: null,
			simulationResult: null,
			vibeRequest: null,
			comparisonView: 'simulation',
			selectedActionId: null,
		});
	});

	it('renders live (empty) events when not in review', () => {
		renderWrapper();
		const calls = calendarSpy.mock.calls;
		const lastCall = calls[calls.length - 1][0] as { events: unknown[] };
		expect(lastCall.events).toHaveLength(0);
	});

	it('swaps in overlay events from preview.subCalendarEvents when entering review', () => {
		renderWrapper();

		const result = fixture as unknown as SimulationScheduleResult;
		const expectedCount = result.preview.subCalendarEvents!.length;

		const simulation: SimulationDto = {
			id: 'sim-1',
			vibeRequestId: 'vibe-request-fixture-id',
			tilerUserId: 'user-1',
			creationTimeInMs: 1714800000000,
			state: SimulationState.Ready,
			previewActions: [],
		};
		const vibeRequest: VibeRequest = {
			id: 'vibe-request-fixture-id',
			creationTimeInMs: 1714800000000,
			activeAction: null,
			isClosed: false,
			beforeScheduleId: null,
			afterScheduleId: null,
			actions: [],
		};

		act(() => {
			useSimulationOverlayStore.getState().enterReview({
				simulation,
				simulationResult: result,
				vibeRequest,
			});
		});

		const calls = calendarSpy.mock.calls;
		const lastCall = calls[calls.length - 1][0] as { events: unknown[] };
		expect(lastCall.events).toHaveLength(expectedCount);
		expect(expectedCount).toBeGreaterThan(0);
	});

	it('forwards classification + click handler + selection key into <Calendar /> in review', () => {
		renderWrapper();

		const result = fixture as unknown as SimulationScheduleResult;
		const firstEventId = (result.preview.subCalendarEvents as Array<{ id: string }>)[0].id;

		const previewActions = [
			{
				actionId: 'action-A',
				entityId: firstEventId,
				entityType: 'SubcalendarEvent',
				vibePreviewId: 'sim-1',
			},
		];

		const simulation: SimulationDto = {
			id: 'sim-1',
			vibeRequestId: 'vibe-request-fixture-id',
			tilerUserId: 'user-1',
			creationTimeInMs: 1714800000000,
			state: SimulationState.Ready,
			previewActions,
		};
		const vibeRequest: VibeRequest = {
			id: 'vibe-request-fixture-id',
			creationTimeInMs: 1714800000000,
			activeAction: null,
			isClosed: false,
			beforeScheduleId: null,
			afterScheduleId: null,
			actions: [],
		};

		act(() => {
			useSimulationOverlayStore.getState().enterReview({
				simulation,
				simulationResult: result,
				vibeRequest,
			});
		});

		const calls2 = calendarSpy.mock.calls;
		const lastProps = calls2[calls2.length - 1][0] as {
			simulationClassification?: Record<string, unknown>;
			onSimulatedTileClick?: (id: string, type: string) => void;
			selectedSimulationKey: string | null;
		};

		// Classification map exists and is keyed by composite entity key.
		expect(lastProps.simulationClassification).toBeDefined();
		const classificationKey = `SubcalendarEvent:${firstEventId}`;
		expect(lastProps.simulationClassification![classificationKey]).toBeDefined();

		// Plan §5.3 — entering review auto-selects the first reviewable
		// action, so the calendar already exposes the matching composite key
		// (so the tile paints its selection ring on first paint).
		expect(lastProps.selectedSimulationKey).toBe(classificationKey);

		// Click handler is wired and routes the tile back to the chip selection.
		expect(typeof lastProps.onSimulatedTileClick).toBe('function');
		act(() => {
			lastProps.onSimulatedTileClick!(firstEventId, 'SubcalendarEvent');
		});
		expect(useSimulationOverlayStore.getState().selectedActionId).toBe('action-A');

		// After selection update, the wrapper re-renders and exposes the
		// composite key so the matching tile can paint its selection ring.
		const after = calendarSpy.mock.calls;
		const afterProps = after[after.length - 1][0] as {
			selectedSimulationKey: string | null;
		};
		expect(afterProps.selectedSimulationKey).toBe(classificationKey);
	});

	it('renders nothing on the grid if the wire key is wrong (regression guard)', () => {
		renderWrapper();

		// Simulate the bug we just fixed: server sent the schedule under a
		// non-existent key. The wrapper must not crash and must fall back to
		// an empty overlay (visible blank grid is a real bug, but it should
		// surface as zero events, not an exception).
		const broken = {
			preview: {
				// Intentionally wrong key for the regression guard — mirrors
				// the bug we just fixed where the client looked up `subEvents`
				// while the server emits `subCalendarEvents`.
				subEvents: (fixture as { preview: { subCalendarEvents: unknown[] } }).preview
					.subCalendarEvents,
				previewActions: [],
				previewId: 'p',
				vibeRequestId: 'v',
			},
		} as unknown as SimulationScheduleResult;

		const simulation: SimulationDto = {
			id: 'sim-1',
			vibeRequestId: 'v',
			tilerUserId: 'user-1',
			creationTimeInMs: 1714800000000,
			state: SimulationState.Ready,
			previewActions: [],
		};
		const vibeRequest: VibeRequest = {
			id: 'v',
			creationTimeInMs: 1714800000000,
			activeAction: null,
			isClosed: false,
			beforeScheduleId: null,
			afterScheduleId: null,
			actions: [],
		};

		act(() => {
			useSimulationOverlayStore.getState().enterReview({
				simulation,
				simulationResult: broken,
				vibeRequest,
			});
		});

		const calls = calendarSpy.mock.calls;
		const lastCall = calls[calls.length - 1][0] as { events: unknown[] };
		expect(lastCall.events).toHaveLength(0);
	});
});
