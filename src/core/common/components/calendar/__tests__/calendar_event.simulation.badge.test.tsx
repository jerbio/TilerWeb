import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@/test/test-utils';
import { ThemeProvider } from '@/core/theme/ThemeProvider';
import CalendarEvent from '../calendar_event';
import type { StyledEvent } from '../calendar_events';
import type { SimulatedTileClassification } from '@/core/util/simulationDiff';
import useSimulationOverlayStore from '@/core/state/simulationOverlayStore';

vi.mock('@/core/common/components/calendar/calendar-ui.provider', () => ({
	useCalendarUI: () => vi.fn(),
	CalendarUIProvider: ({ children }: { children: React.ReactNode }) => children,
}));

const baseEvent: StyledEvent = {
	id: 'evt-1',
	key: 'evt-1',
	name: 'Workout',
	start: 1714809600000,
	end: 1714813200000,
	originalStart: 1714809600000,
	originalEnd: 1714813200000,
	calendarEventStart: 1714809600000,
	calendarEventEnd: 1714813200000,
	isSleep: false,
	isRigid: false,
	isViable: true,
	isComplete: false,
	isTardy: false,
	colorRed: 99,
	colorGreen: 102,
	colorBlue: 241,
	properties: {
		eventChainKey: 'c1',
		eventChainIndex: 0,
		eventChainLength: 1,
		startHourFraction: 8,
		endHourFraction: 9,
	},
	springStyles: { x: 0, y: 0, width: 100, height: 60 },
} as unknown as StyledEvent;

function renderTile(simulation?: SimulatedTileClassification) {
	return render(
		<ThemeProvider>
			<CalendarEvent
				event={baseEvent}
				selectedEvent={null}
				setSelectedEvent={() => {}}
				setSelectedEventInfo={() => {}}
				simulation={simulation}
			/>
		</ThemeProvider>
	);
}

describe('CalendarEvent — simulation badge', () => {
	it('shows "+" for new tiles', () => {
		renderTile({ tier: 'primary', kind: 'new' });
		expect(screen.getByTestId('simulation-badge')).toHaveTextContent('+');
	});

	it('shows "×" for removed tiles', () => {
		renderTile({ tier: 'cascade', kind: 'removed' });
		expect(screen.getByTestId('simulation-badge')).toHaveTextContent('×');
	});

	it('shows "→" for updated tiles', () => {
		renderTile({ tier: 'primary', kind: 'updated' });
		expect(screen.getByTestId('simulation-badge')).toHaveTextContent('→');
	});

	it('shows "⚠" for conflict-tier tiles', () => {
		renderTile({ tier: 'conflict', kind: 'updated' });
		expect(screen.getByTestId('simulation-badge')).toHaveTextContent('⚠');
	});

	it('shows "→" for cascade-tier updated tiles', () => {
		renderTile({ tier: 'cascade', kind: 'updated' });
		expect(screen.getByTestId('simulation-badge')).toHaveTextContent('→');
	});

	it('shows no badge for mapped-tier tiles', () => {
		renderTile({ tier: 'mapped', kind: 'mapped' });
		expect(screen.queryByTestId('simulation-badge')).not.toBeInTheDocument();
	});

	it('shows no badge for unchanged tiles', () => {
		renderTile({ tier: 'unchanged', kind: 'unchanged' });
		expect(screen.queryByTestId('simulation-badge')).not.toBeInTheDocument();
	});

	it('shows no badge when no simulation prop is provided', () => {
		renderTile(undefined);
		expect(screen.queryByTestId('simulation-badge')).not.toBeInTheDocument();
	});
});

describe('CalendarEvent — filter dimming', () => {
	beforeEach(() => {
		useSimulationOverlayStore.setState({ inReview: true, activeKindFilter: null });
	});

	it('is not dimmed when no filter is active', () => {
		renderTile({ tier: 'primary', kind: 'new' });
		expect(screen.queryByTestId('event-container')).not.toHaveAttribute(
			'data-filter-dimmed',
			'true'
		);
	});

	it('is not dimmed when filter matches the tile kind', () => {
		useSimulationOverlayStore.setState({ inReview: true, activeKindFilter: 'new' });
		renderTile({ tier: 'primary', kind: 'new' });
		expect(screen.queryByTestId('event-container')).not.toHaveAttribute(
			'data-filter-dimmed',
			'true'
		);
	});

	it('is dimmed when filter does not match the tile kind', () => {
		useSimulationOverlayStore.setState({ inReview: true, activeKindFilter: 'removed' });
		renderTile({ tier: 'primary', kind: 'new' });
		expect(screen.getByTestId('event-container')).toHaveAttribute('data-filter-dimmed', 'true');
	});

	it('is not dimmed for conflict-tier tile when filter is "conflict"', () => {
		useSimulationOverlayStore.setState({ inReview: true, activeKindFilter: 'conflict' });
		renderTile({ tier: 'conflict', kind: 'updated' });
		expect(screen.queryByTestId('event-container')).not.toHaveAttribute(
			'data-filter-dimmed',
			'true'
		);
	});

	it('is dimmed for primary-tier tile when filter is "conflict"', () => {
		useSimulationOverlayStore.setState({ inReview: true, activeKindFilter: 'conflict' });
		renderTile({ tier: 'primary', kind: 'new' });
		expect(screen.getByTestId('event-container')).toHaveAttribute('data-filter-dimmed', 'true');
	});

	it('is not dimmed when no simulation prop (non-simulated tile)', () => {
		useSimulationOverlayStore.setState({ inReview: true, activeKindFilter: 'new' });
		renderTile(undefined);
		expect(screen.queryByTestId('event-container')).not.toHaveAttribute(
			'data-filter-dimmed',
			'true'
		);
	});
});

describe('CalendarEvent — removed ghost tile', () => {
	beforeEach(() => {
		useSimulationOverlayStore.setState({ inReview: true, activeKindFilter: null });
	});

	it('marks the container as a ghost for removed tiles', () => {
		renderTile({ tier: 'primary', kind: 'removed' });
		expect(screen.getByTestId('event-container')).toHaveAttribute(
			'data-simulation-ghost',
			'true'
		);
	});

	it('does not mark non-removed tiles as ghosts', () => {
		renderTile({ tier: 'primary', kind: 'new' });
		expect(screen.queryByTestId('event-container')).not.toHaveAttribute(
			'data-simulation-ghost'
		);
	});

	it('is read-only: clicking a ghost does not fire onSimulatedClick', () => {
		const onSim = vi.fn();
		render(
			<ThemeProvider>
				<CalendarEvent
					event={baseEvent}
					selectedEvent={null}
					setSelectedEvent={() => {}}
					setSelectedEventInfo={() => {}}
					simulation={{ tier: 'primary', kind: 'removed' }}
					onSimulatedClick={onSim}
				/>
			</ThemeProvider>
		);
		screen.getByRole('heading', { name: 'Workout' }).click();
		expect(onSim).not.toHaveBeenCalled();
	});

	it('stays visible (not dimmed) when the removed filter is active', () => {
		useSimulationOverlayStore.setState({ inReview: true, activeKindFilter: 'removed' });
		renderTile({ tier: 'primary', kind: 'removed' });
		const container = screen.getByTestId('event-container');
		expect(container).toHaveAttribute('data-simulation-ghost', 'true');
		expect(container).not.toHaveAttribute('data-filter-dimmed', 'true');
	});
});
