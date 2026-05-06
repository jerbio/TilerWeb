import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import SimulationReviewPanel from './SimulationReviewPanel';
import {
	SimulationDto,
	SimulationActionDto,
	SimulationScheduleResult,
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
		state: 'Ready',
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
