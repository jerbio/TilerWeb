import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@/test/test-utils';
import { ThemeProvider } from '@/core/theme/ThemeProvider';
import CalendarEvent from '../calendar_event';
import type { StyledEvent } from '../calendar_events';
import type { SimulatedTileClassification } from '@/core/util/simulationDiff';

// Plan §5.2 — per-tier styling and §5.3.2 — click forwarding through
// `onSimulatedClick`. We assert via DOM data attributes instead of pixel
// snapshots; styling is validated qualitatively in the styled-component
// branches and visually during dogfooding.

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
	// Cast: StyledEvent extends SubCalendarEvent which has many more fields the
	// component does not exercise in these tests.
} as unknown as StyledEvent;

const renderTile = (
	simulation?: SimulatedTileClassification,
	extra: Partial<{ onSimulatedClick: () => void; simulationSelected: boolean }> = {}
) =>
	render(
		<ThemeProvider>
			<CalendarEvent
				event={baseEvent}
				selectedEvent={null}
				setSelectedEvent={() => {}}
				setSelectedEventInfo={() => {}}
				simulation={simulation}
				onSimulatedClick={extra.onSimulatedClick}
				simulationSelected={extra.simulationSelected}
			/>
		</ThemeProvider>
	);

describe('CalendarEvent — simulation tier styling', () => {
	it.each([
		['primary', 'new'],
		['conflict', 'updated'],
		['cascade', 'updated'],
		['mapped', 'mapped'],
	] as const)('exposes data-simulation-tier=%s for tier %s', (tier, kind) => {
		const { container } = renderTile({ tier, kind } as SimulatedTileClassification);
		const root = container.querySelector(`[data-simulation-tier="${tier}"]`);
		expect(root).not.toBeNull();
		expect(root!.getAttribute('data-simulation-kind')).toBe(kind);
	});

	it('renders no tier attribute when no classification is supplied', () => {
		const { container } = renderTile(undefined);
		expect(container.querySelector('[data-simulation-tier]')).toBeNull();
	});

	it('routes clicks to onSimulatedClick when classification is present (read-only)', () => {
		const setInfo = vi.fn();
		const setSel = vi.fn();
		const onSim = vi.fn();
		const { container } = render(
			<ThemeProvider>
				<CalendarEvent
					event={baseEvent}
					selectedEvent={null}
					setSelectedEvent={setSel}
					setSelectedEventInfo={setInfo}
					simulation={{ tier: 'primary', kind: 'new' }}
					onSimulatedClick={onSim}
				/>
			</ThemeProvider>
		);
		// The clickable surface is the inner content div (handles onClick).
		// Find the deepest div that holds the "Workout" header text.
		const header = container.querySelector('h3');
		expect(header).not.toBeNull();
		// Walk up to the EventContent (next div above header → footer container).
		// Easiest: click the header; React event delegation bubbles to onClick.
		fireEvent.click(header!.parentElement!.parentElement!);
		expect(onSim).toHaveBeenCalledTimes(1);
		expect(setInfo).not.toHaveBeenCalled();
		expect(setSel).not.toHaveBeenCalled();
	});

	it('marks the tile as simulationSelected when prop is true', () => {
		const { container } = renderTile(
			{ tier: 'cascade', kind: 'updated' },
			{ simulationSelected: true }
		);
		const root = container.querySelector('[data-simulation-tier="cascade"]');
		expect(root).not.toBeNull();
		expect(root!.getAttribute('data-simulation-selected')).toBe('true');
	});
});
