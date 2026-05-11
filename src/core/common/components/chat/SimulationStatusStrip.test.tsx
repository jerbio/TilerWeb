import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import SimulationStatusStrip from './SimulationStatusStrip';
import { SimulationDto, SimulationState, VibeRequest } from '@/core/common/types/chat';
import { ThemeProvider } from '@/core/theme/ThemeProvider';

vi.mock('react-i18next', () => ({
	useTranslation: () => ({
		t: (_k: string, fallback?: string) => fallback ?? _k,
		i18n: { language: 'en' },
	}),
}));

function makeSim(state: SimulationState, overrides: Partial<SimulationDto> = {}): SimulationDto {
	return {
		id: 'p1',
		vibeRequestId: 'r1',
		tilerUserId: 'u',
		creationTimeInMs: 1,
		state,
		previewActions: [],
		...overrides,
	};
}

function makeRequest(overrides: Partial<VibeRequest> = {}): VibeRequest {
	return {
		id: 'r1',
		creationTimeInMs: 1,
		activeAction: null,
		isClosed: false,
		beforeScheduleId: null,
		afterScheduleId: null,
		actions: [],
		...overrides,
	};
}

function renderStrip(props: React.ComponentProps<typeof SimulationStatusStrip>) {
	return render(
		<ThemeProvider>
			<SimulationStatusStrip {...props} />
		</ThemeProvider>
	);
}

describe('SimulationStatusStrip', () => {
	it('shows "starting" when no simulation yet but request is in-flight', () => {
		renderStrip({
			simulation: null,
			request: makeRequest(),
			onReview: vi.fn(),
		});
		expect(screen.getByText(/simulation starting/i)).toBeInTheDocument();
	});

	it('renders nothing when no simulation AND request is terminal', () => {
		const { container } = renderStrip({
			simulation: null,
			request: makeRequest({ isClosed: true }),
			onReview: vi.fn(),
		});
		expect(container).toBeEmptyDOMElement();
	});

	// Regression: home-page first paint with no chat session loaded yet
	// passed `simulation=null, request=null` and the strip used to fall
	// through to "Simulation starting…". It must stay hidden until there
	// is an actual in-flight request.
	it('renders nothing when there is no simulation AND no request (initial home load)', () => {
		const { container } = renderStrip({
			simulation: null,
			request: null,
			onReview: vi.fn(),
		});
		expect(container).toBeEmptyDOMElement();
	});

	it('renders nothing when simulation is Invalidated', () => {
		const { container } = renderStrip({
			simulation: makeSim(SimulationState.Invalidated),
			request: makeRequest(),
			onReview: vi.fn(),
		});
		expect(container).toBeEmptyDOMElement();
	});

	it('shows queued copy with spinner', () => {
		renderStrip({
			simulation: makeSim(SimulationState.Queued),
			request: makeRequest(),
			onReview: vi.fn(),
		});
		expect(screen.getByText(/simulation queued/i)).toBeInTheDocument();
		expect(screen.getByTestId('simulation-spinner')).toBeInTheDocument();
	});

	it('shows generating copy when Processing', () => {
		renderStrip({
			simulation: makeSim(SimulationState.Processing),
			request: makeRequest(),
			onReview: vi.fn(),
		});
		expect(screen.getByText(/generating simulation/i)).toBeInTheDocument();
	});

	it('shows ready copy with action count and Review button', () => {
		const sim = makeSim(SimulationState.Ready, {
			previewActions: [
				{ actionId: 'a', vibePreviewId: 'p1' },
				{ actionId: 'b', vibePreviewId: 'p1' },
				{ actionId: 'c', vibePreviewId: 'p1' },
			],
		});
		renderStrip({
			simulation: sim,
			request: makeRequest(),
			onReview: vi.fn(),
		});
		expect(screen.getByText(/3 changes/i)).toBeInTheDocument();
		expect(screen.getByRole('button', { name: /review tilecast/i })).toBeInTheDocument();
	});

	it('fires onReview when Review button clicked', () => {
		const onReview = vi.fn();
		renderStrip({
			simulation: makeSim(SimulationState.Ready),
			request: makeRequest(),
			onReview,
		});
		fireEvent.click(screen.getByRole('button', { name: /review tilecast/i }));
		expect(onReview).toHaveBeenCalledTimes(1);
	});

	it('shows failed copy with Retry button when onRetry provided', () => {
		const onRetry = vi.fn();
		renderStrip({
			simulation: makeSim(SimulationState.Failed),
			request: makeRequest(),
			onReview: vi.fn(),
			onRetry,
		});
		expect(screen.getByText(/simulation unavailable/i)).toBeInTheDocument();
		fireEvent.click(screen.getByRole('button', { name: /retry/i }));
		expect(onRetry).toHaveBeenCalledTimes(1);
	});

	it('hides Retry when onRetry not provided', () => {
		renderStrip({
			simulation: makeSim(SimulationState.Failed),
			request: makeRequest(),
			onReview: vi.fn(),
		});
		expect(screen.queryByRole('button', { name: /retry/i })).not.toBeInTheDocument();
	});

	// Plan §6.6.3 — refresh into a session whose latest request was
	// already superseded should NOT prompt the user to review/apply the
	// stale embedded preview, even when its state is `Ready`.
	it('renders nothing when the request is superseded (even with a Ready simulation)', () => {
		const { container } = renderStrip({
			simulation: makeSim(SimulationState.Ready, {
				previewActions: [{ actionId: 'a', vibePreviewId: 'p1' }],
			}),
			request: makeRequest({ supersededByRequestId: 'r2' }),
			onReview: vi.fn(),
		});
		expect(container).toBeEmptyDOMElement();
	});
});
