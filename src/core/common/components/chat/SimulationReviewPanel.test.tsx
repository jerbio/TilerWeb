import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import React from 'react';
import SimulationReviewPanel from './SimulationReviewPanel';
import useSimulationOverlayStore from '@/core/state/simulationOverlayStore';
import {
	SimulationDto,
	SimulationActionDto,
	SimulationScheduleResult,
	SimulationState,
	VibeRequest,
	VibeAction,
} from '@/core/common/types/chat';
import { Status, Actions } from '@/core/constants/enums';
import { ThemeProvider } from '@/core/theme/ThemeProvider';

vi.mock('react-i18next', () => ({
	useTranslation: () => ({
		t: (_k: string, fallback?: string) => fallback ?? _k,
		i18n: { language: 'en' },
	}),
}));

function makeAction(id: string, overrides: Partial<VibeAction> = {}): VibeAction {
	return {
		id,
		descriptions: `Description ${id}`,
		type: Actions.Add_New_Appointment as unknown as VibeAction['type'],
		creationTimeInMs: 1,
		status: Status.Pending,
		entityId: `entity-${id}`,
		entityType: 'SubCalendarEvent',
		beforeScheduleId: null,
		afterScheduleId: null,
		vibeRequest: null,
		...overrides,
	};
}

function makePreviewAction(actionId: string): SimulationActionDto {
	return {
		actionId,
		entityId: `entity-${actionId}`,
		entityType: 'SubCalendarEvent',
		vibePreviewId: 'p1',
	};
}

function makeRequest(actions: VibeAction[]): VibeRequest {
	return {
		id: 'r1',
		creationTimeInMs: 1,
		activeAction: null,
		isClosed: false,
		beforeScheduleId: null,
		afterScheduleId: null,
		actions,
	};
}

function makeSimulation(previewActions: SimulationActionDto[]): SimulationDto {
	return {
		id: 'p1',
		vibeRequestId: 'r1',
		tilerUserId: 'u',
		creationTimeInMs: 1,
		state: SimulationState.Ready,
		previewActions,
	};
}

function makeResult(): SimulationScheduleResult {
	return { preview: { subEvents: [], calendarEvents: [] } };
}

function renderPanel(props: Partial<React.ComponentProps<typeof SimulationReviewPanel>> = {}) {
	const a1 = makeAction('a1');
	const a2 = makeAction('a2');
	const a3 = makeAction('a3'); // no preview action — exercise missing-preview branch
	const defaults: React.ComponentProps<typeof SimulationReviewPanel> = {
		request: makeRequest([a1, a2, a3]),
		simulation: makeSimulation([makePreviewAction('a1'), makePreviewAction('a2')]),
		result: makeResult(),
		selectedActionId: null,
		onSelect: vi.fn(),
		onApply: vi.fn(),
		onExitReview: vi.fn(),
	};
	const merged = { ...defaults, ...props };
	const utils = render(
		<ThemeProvider>
			<SimulationReviewPanel {...merged} />
		</ThemeProvider>
	);
	return { ...utils, props: merged };
}

describe('SimulationReviewPanel', () => {
	it('renders one row per action including those without a previewAction', () => {
		renderPanel();
		expect(screen.getByText(/Description a1/i)).toBeInTheDocument();
		expect(screen.getByText(/Description a2/i)).toBeInTheDocument();
		expect(screen.getByText(/Description a3/i)).toBeInTheDocument();
		expect(
			screen.getByText(/No simulated schedule item available for this change/i)
		).toBeInTheDocument();
	});

	it('renders Apply now and Exit review buttons', () => {
		renderPanel();
		expect(screen.getByRole('button', { name: /apply now/i })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: /exit review/i })).toBeInTheDocument();
	});

	it('Apply now invokes onApply', () => {
		const { props } = renderPanel();
		fireEvent.click(screen.getByRole('button', { name: /apply now/i }));
		expect(props.onApply).toHaveBeenCalledTimes(1);
	});

	it('Exit review invokes onExitReview', () => {
		const { props } = renderPanel();
		fireEvent.click(screen.getByRole('button', { name: /exit review/i }));
		expect(props.onExitReview).toHaveBeenCalledTimes(1);
	});

	it('clicking a row invokes onSelect with the action id', () => {
		const { props } = renderPanel();
		fireEvent.click(screen.getByText(/Description a2/i));
		expect(props.onSelect).toHaveBeenCalledWith('a2');
	});

	it('Next stepper advances selection through every action', () => {
		const onSelect = vi.fn();
		const { rerender, props } = renderPanel({ selectedActionId: 'a1', onSelect });
		fireEvent.click(screen.getByRole('button', { name: /next/i }));
		expect(onSelect).toHaveBeenLastCalledWith('a2');
		rerender(
			<ThemeProvider>
				<SimulationReviewPanel {...props} selectedActionId="a2" onSelect={onSelect} />
			</ThemeProvider>
		);
		fireEvent.click(screen.getByRole('button', { name: /next/i }));
		expect(onSelect).toHaveBeenLastCalledWith('a3');
	});

	it('Previous stepper moves selection backwards', () => {
		const onSelect = vi.fn();
		renderPanel({ selectedActionId: 'a2', onSelect });
		fireEvent.click(screen.getByRole('button', { name: /previous/i }));
		expect(onSelect).toHaveBeenLastCalledWith('a1');
	});

	it('Next stops at the last action (no wrap-around)', () => {
		const onSelect = vi.fn();
		renderPanel({ selectedActionId: 'a3', onSelect });
		const next = screen.getByRole('button', { name: /next/i });
		expect(next).toBeDisabled();
		fireEvent.click(next);
		expect(onSelect).not.toHaveBeenCalled();
	});

	it('Previous stops at the first action (no wrap-around)', () => {
		const onSelect = vi.fn();
		renderPanel({ selectedActionId: 'a1', onSelect });
		const prev = screen.getByRole('button', { name: /previous/i });
		expect(prev).toBeDisabled();
		fireEvent.click(prev);
		expect(onSelect).not.toHaveBeenCalled();
	});

	it('with no selection, Next selects the first action', () => {
		const onSelect = vi.fn();
		renderPanel({ selectedActionId: null, onSelect });
		fireEvent.click(screen.getByRole('button', { name: /next/i }));
		expect(onSelect).toHaveBeenLastCalledWith('a1');
	});

	it('marks the selected row with aria-current="true"', () => {
		renderPanel({ selectedActionId: 'a2' });
		const row = screen.getByText(/Description a2/i).closest('[role="listitem"]');
		expect(row).toHaveAttribute('aria-current', 'true');
	});
});

// ---------------------------------------------------------------------------
// Mobile collapse-stop behavior (peek / mid / full).
// useIsMobile resolves true when window.innerWidth < theme.screens.lg (1024).
// Because the panel reads `reviewStop` from the global store, each test seeds
// the store and resets it afterwards.
// ---------------------------------------------------------------------------
describe('SimulationReviewPanel — mobile collapse stops', () => {
	const originalInnerWidth = window.innerWidth;
	const initialStoreState = useSimulationOverlayStore.getState();

	beforeEach(() => {
		Object.defineProperty(window, 'innerWidth', {
			configurable: true,
			writable: true,
			value: 480,
		});
		useSimulationOverlayStore.setState(initialStoreState, true);
	});

	afterEach(() => {
		Object.defineProperty(window, 'innerWidth', {
			configurable: true,
			writable: true,
			value: originalInnerWidth,
		});
	});

	it('renders the collapse toggle on mobile', () => {
		renderPanel();
		expect(screen.getByTestId('review-collapse-toggle')).toBeInTheDocument();
	});

	it('peek stop hides the action list, stepper, and footer', () => {
		useSimulationOverlayStore.setState({ reviewStop: 'peek' });
		renderPanel({ selectedActionId: 'a1' });
		expect(screen.queryByText(/Description a2/i)).not.toBeInTheDocument();
		expect(screen.queryByRole('button', { name: /apply now/i })).not.toBeInTheDocument();
		expect(screen.queryByRole('button', { name: /^next$/i })).not.toBeInTheDocument();
	});

	it('peek stop shows the current action title in the header', () => {
		useSimulationOverlayStore.setState({ reviewStop: 'peek' });
		renderPanel({ selectedActionId: 'a2' });
		// The current action title is the only place "Description a2" appears in
		// peek mode (the action list is collapsed).
		expect(screen.getByText(/Description a2/i)).toBeInTheDocument();
	});

	it('mid stop shows stepper + footer but hides the action list', () => {
		useSimulationOverlayStore.setState({ reviewStop: 'mid' });
		renderPanel({ selectedActionId: 'a1' });
		expect(screen.getByRole('button', { name: /apply now/i })).toBeInTheDocument();
		expect(screen.getByTestId('review-prev-button')).toBeInTheDocument();
		expect(screen.getByTestId('review-next-button')).toBeInTheDocument();
		// Action list rows are not rendered.
		expect(screen.queryByText(/Description a2/i)).not.toBeInTheDocument();
		expect(screen.queryByText(/Description a3/i)).not.toBeInTheDocument();
	});

	it('full stop shows the complete panel including the action list', () => {
		useSimulationOverlayStore.setState({ reviewStop: 'full' });
		renderPanel();
		expect(screen.getByText(/Description a1/i)).toBeInTheDocument();
		expect(screen.getByText(/Description a2/i)).toBeInTheDocument();
		expect(screen.getByText(/Description a3/i)).toBeInTheDocument();
		expect(screen.getByRole('button', { name: /apply now/i })).toBeInTheDocument();
	});

	it('clicking the collapse toggle cycles peek → mid → full → hidden → peek', () => {
		act(() => useSimulationOverlayStore.setState({ reviewStop: 'peek' }));
		renderPanel();
		const toggle = screen.getByTestId('review-collapse-toggle');
		fireEvent.click(toggle);
		expect(useSimulationOverlayStore.getState().reviewStop).toBe('mid');
		fireEvent.click(toggle);
		expect(useSimulationOverlayStore.getState().reviewStop).toBe('full');
		fireEvent.click(toggle);
		expect(useSimulationOverlayStore.getState().reviewStop).toBe('hidden');
		// `hidden` collapses the header so the toggle button is no longer
		// rendered. The grab pill remains tappable to cycle back to peek.
		const grabPill = screen.getByLabelText(/Simulation review/i).querySelector('div');
		expect(grabPill).toBeTruthy();
		if (grabPill) fireEvent.click(grabPill);
		expect(useSimulationOverlayStore.getState().reviewStop).toBe('peek');
	});
});

// ---------------------------------------------------------------------------
// Desktop ignores the store stop and always renders the full panel.
// ---------------------------------------------------------------------------
describe('SimulationReviewPanel — desktop ignores reviewStop', () => {
	const originalInnerWidth = window.innerWidth;
	const initialStoreState = useSimulationOverlayStore.getState();

	beforeEach(() => {
		Object.defineProperty(window, 'innerWidth', {
			configurable: true,
			writable: true,
			value: 1440,
		});
		useSimulationOverlayStore.setState(initialStoreState, true);
	});

	afterEach(() => {
		Object.defineProperty(window, 'innerWidth', {
			configurable: true,
			writable: true,
			value: originalInnerWidth,
		});
	});

	it('does not render the collapse toggle', () => {
		renderPanel();
		expect(screen.queryByTestId('review-collapse-toggle')).not.toBeInTheDocument();
	});

	it('renders the full action list even when store says peek', () => {
		useSimulationOverlayStore.setState({ reviewStop: 'peek' });
		renderPanel();
		expect(screen.getByText(/Description a1/i)).toBeInTheDocument();
		expect(screen.getByText(/Description a2/i)).toBeInTheDocument();
		expect(screen.getByRole('button', { name: /apply now/i })).toBeInTheDocument();
	});

	it('Next still advances selection on desktop regardless of reviewStop', () => {
		useSimulationOverlayStore.setState({ reviewStop: 'peek' });
		const onSelect = vi.fn();
		renderPanel({ selectedActionId: 'a1', onSelect });
		fireEvent.click(screen.getByTestId('review-next-button'));
		expect(onSelect).toHaveBeenLastCalledWith('a2');
	});

	it('Previous still moves selection backwards on desktop regardless of reviewStop', () => {
		useSimulationOverlayStore.setState({ reviewStop: 'mid' });
		const onSelect = vi.fn();
		renderPanel({ selectedActionId: 'a2', onSelect });
		fireEvent.click(screen.getByTestId('review-prev-button'));
		expect(onSelect).toHaveBeenLastCalledWith('a1');
	});

	it('Apply now still fires onApply on desktop regardless of reviewStop', () => {
		useSimulationOverlayStore.setState({ reviewStop: 'peek' });
		const { props } = renderPanel();
		fireEvent.click(screen.getByRole('button', { name: /apply now/i }));
		expect(props.onApply).toHaveBeenCalledTimes(1);
	});
});

// ---------------------------------------------------------------------------
// Clicking a tilecast row must propagate selection so the calendar grid can
// react. The panel's contract is to fire `onSelect(actionId)`; in the live
// app `chat.tsx` wires that to `setSelectedActionId` on the overlay store
// (which `calendar_wrapper.tsx` then reads to drive `selectedSimulationKey`).
//
// These tests treat the store as the integration boundary: we bind onSelect
// to `setSelectedActionId` and assert that each row click drives the store.
// ---------------------------------------------------------------------------
describe('SimulationReviewPanel — tilecast click → store selection (grid sync)', () => {
	const initialStoreState = useSimulationOverlayStore.getState();

	beforeEach(() => {
		useSimulationOverlayStore.setState(initialStoreState, true);
	});

	afterEach(() => {
		useSimulationOverlayStore.setState(initialStoreState, true);
	});

	it('clicking a row writes the action id to the overlay store', () => {
		const setSelectedActionId = useSimulationOverlayStore.getState().setSelectedActionId;
		renderPanel({ onSelect: setSelectedActionId });
		fireEvent.click(screen.getByText(/Description a2/i));
		expect(useSimulationOverlayStore.getState().selectedActionId).toBe('a2');
	});

	it('clicking each rendered row in turn updates the store to that action', () => {
		const setSelectedActionId = useSimulationOverlayStore.getState().setSelectedActionId;
		renderPanel({ onSelect: setSelectedActionId });
		for (const id of ['a1', 'a2', 'a3']) {
			fireEvent.click(screen.getByText(new RegExp(`Description ${id}`, 'i')));
			expect(useSimulationOverlayStore.getState().selectedActionId).toBe(id);
		}
	});

	it('Next/Previous via the stepper also drive the store selection', () => {
		const setSelectedActionId = useSimulationOverlayStore.getState().setSelectedActionId;
		useSimulationOverlayStore.setState({ selectedActionId: 'a1' });
		const { rerender, props } = renderPanel({
			selectedActionId: 'a1',
			onSelect: setSelectedActionId,
		});
		fireEvent.click(screen.getByTestId('review-next-button'));
		expect(useSimulationOverlayStore.getState().selectedActionId).toBe('a2');
		// Re-render with the new selection so the stepper recomputes its index.
		rerender(
			<ThemeProvider>
				<SimulationReviewPanel
					{...props}
					selectedActionId="a2"
					onSelect={setSelectedActionId}
				/>
			</ThemeProvider>
		);
		fireEvent.click(screen.getByTestId('review-prev-button'));
		expect(useSimulationOverlayStore.getState().selectedActionId).toBe('a1');
	});

	it('selected row is reflected back into the panel via aria-current', () => {
		// Mirrors the desktop bidirectional flow: a tile click on the calendar
		// would call setSelectedActionId; the panel re-renders with the new
		// selectedActionId and marks the matching row as current.
		renderPanel({ selectedActionId: 'a3' });
		const row = screen.getByText(/Description a3/i).closest('[role="listitem"]');
		expect(row).toHaveAttribute('aria-current', 'true');
	});
});
