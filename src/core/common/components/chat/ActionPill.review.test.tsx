import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import ActionPill from './ActionPill';
import { SimulationActionDto, SimulationDto, VibeAction } from '@/core/common/types/chat';
import { Actions, Status } from '@/core/constants/enums';
import { CalendarRequestProvider } from '@/core/common/components/calendar/CalendarRequestProvider';
import { CalendarEntityType } from '@/core/common/components/calendar/calendarRequestContext';
import { ThemeProvider } from '@/core/theme/ThemeProvider';
import useSimulationOverlayStore from '@/core/state/simulationOverlayStore';

// -- Mocks ----------------------------------------------------

const mockGetActivePersonaSession = vi.fn();

vi.mock('@/global_state', () => ({
	__esModule: true,
	default: Object.assign(
		(selector?: (state: unknown) => unknown) => {
			const state = { getActivePersonaSession: mockGetActivePersonaSession };
			return selector ? selector(state) : state;
		},
		{ getState: () => ({ getActivePersonaSession: mockGetActivePersonaSession }) }
	),
}));

vi.mock('react-i18next', () => ({
	useTranslation: () => ({
		t: (_k: string, fb: string) => fb,
		i18n: { language: 'en' },
	}),
}));

// -- Helpers --------------------------------------------------

function action(overrides: Partial<VibeAction> = {}): VibeAction {
	return {
		id: 'act-1',
		descriptions: 'Add morning standup',
		type: Actions.Add_New_Task,
		creationTimeInMs: Date.now(),
		status: Status.Executed,
		entityId: 'entity-abc',
		entityType: CalendarEntityType.SubcalendarEvent,
		beforeScheduleId: 'schedule-v1',
		afterScheduleId: 'schedule-v2',
		vibeRequest: null,
		...overrides,
	};
}

function simAction(overrides: Partial<SimulationActionDto> = {}): SimulationActionDto {
	return {
		actionId: 'act-1',
		entityId: 'entity-abc',
		entityType: CalendarEntityType.SubcalendarEvent,
		action: action(),
		...overrides,
	} as SimulationActionDto;
}

function simulation(overrides: Partial<SimulationDto> = {}): SimulationDto {
	return {
		id: 'sim-1',
		state: 'Ready',
		previewActions: [simAction()],
		subCalendarEvents: [],
		...overrides,
	} as SimulationDto;
}

function renderPill(props: {
	a?: VibeAction;
	sim?: SimulationDto | null;
	sa?: SimulationActionDto;
}) {
	return render(
		<ThemeProvider>
			<CalendarRequestProvider>
				<ActionPill
					action={props.a ?? action()}
					simulation={props.sim ?? null}
					simulationAction={props.sa}
				/>
			</CalendarRequestProvider>
		</ThemeProvider>
	);
}

beforeEach(() => {
	vi.clearAllMocks();
	mockGetActivePersonaSession.mockReturnValue({ scheduleId: 'schedule-v2' });
	// Reset overlay store between tests
	act(() => {
		useSimulationOverlayStore.getState().exitReview();
	});
});

// -- Tests ----------------------------------------------------

describe('ActionPill review-mode affordances (Plan §5.3)', () => {
	it('exposes data-* attributes for debugging and testability', () => {
		renderPill({});
		const w = screen.getByTestId('action-pill-wrapper');
		expect(w.getAttribute('data-action-id')).toBe('act-1');
		expect(w.getAttribute('data-in-review')).toBe('false');
		expect(w.getAttribute('data-has-simulation-action')).toBe('false');
		expect(w.getAttribute('data-reviewable')).toBe('false');
		expect(w.getAttribute('data-navigatable')).toBe('true');
	});

	it('does NOT mark reviewable when no simulationAction is supplied', () => {
		// Even if review mode is on, missing preview action means no halo.
		act(() => {
			useSimulationOverlayStore.getState().enterReview({
				simulation: simulation({ previewActions: [] }),
				simulationResult: { id: 'r-1', dump: '' } as never,
				vibeRequest: { id: 'vr-1' } as never,
			});
		});
		renderPill({ sim: simulation({ previewActions: [] }) });
		const w = screen.getByTestId('action-pill-wrapper');
		expect(w.getAttribute('data-in-review')).toBe('true');
		expect(w.getAttribute('data-has-simulation-action')).toBe('false');
		expect(w.getAttribute('data-reviewable')).toBe('false');
	});

	it('flips reviewable=true when in review with a matching simulationAction', () => {
		act(() => {
			useSimulationOverlayStore.getState().enterReview({
				simulation: simulation(),
				simulationResult: { id: 'r-1', dump: '' } as never,
				vibeRequest: { id: 'vr-1' } as never,
			});
		});
		renderPill({ sim: simulation(), sa: simAction() });
		const w = screen.getByTestId('action-pill-wrapper');
		expect(w.getAttribute('data-reviewable')).toBe('true');
		// Plan §5.3 — entering review auto-selects the first reviewable
		// action so chips/calendar/panel/stepper share a starting selection.
		expect(w.getAttribute('data-selected')).toBe('true');
		expect(w.getAttribute('data-navigatable')).toBe('true');
	});

	it('flips selected=true when selectedActionId matches the action.id', () => {
		act(() => {
			useSimulationOverlayStore.getState().enterReview({
				simulation: simulation(),
				simulationResult: { id: 'r-1', dump: '' } as never,
				vibeRequest: { id: 'vr-1' } as never,
			});
			useSimulationOverlayStore.getState().setSelectedActionId('act-1');
		});
		renderPill({ sim: simulation(), sa: simAction() });
		expect(screen.getByTestId('action-pill-wrapper').getAttribute('data-selected')).toBe(
			'true'
		);
	});

	it('matches selected via simulationAction.actionId fallback', () => {
		const sa = simAction({ actionId: 'preview-xyz' });
		act(() => {
			useSimulationOverlayStore.getState().enterReview({
				simulation: simulation({ previewActions: [sa] }),
				simulationResult: { id: 'r-1', dump: '' } as never,
				vibeRequest: { id: 'vr-1' } as never,
			});
			useSimulationOverlayStore.getState().setSelectedActionId('preview-xyz');
		});
		renderPill({ sim: simulation({ previewActions: [sa] }), sa });
		expect(screen.getByTestId('action-pill-wrapper').getAttribute('data-selected')).toBe(
			'true'
		);
	});

	it('marks navigatable=false when entityType is None', () => {
		renderPill({
			a: action({ entityType: CalendarEntityType.None, entityId: '' }),
		});
		expect(screen.getByTestId('action-pill-wrapper').getAttribute('data-navigatable')).toBe(
			'false'
		);
	});

	it('renders a chevron glyph when navigatable', () => {
		renderPill({});
		// lucide-react renders an <svg class="lucide lucide-chevron-right" />
		const w = screen.getByTestId('action-pill-wrapper');
		expect(w.querySelector('svg')).not.toBeNull();
	});

	it('omits chevron when not navigatable', () => {
		renderPill({
			a: action({ entityType: CalendarEntityType.None, entityId: '' }),
		});
		expect(screen.getByTestId('action-pill-wrapper').querySelector('svg')).toBeNull();
	});
});
