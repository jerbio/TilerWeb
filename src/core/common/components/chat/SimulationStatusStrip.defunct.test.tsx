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

describe('SimulationStatusStrip — defunct state', () => {
	it('shows defunct strip instead of hiding when supersededByRequestId is set', () => {
		const { container } = renderStrip({
			simulation: makeSim(SimulationState.Ready),
			request: makeRequest({ supersededByRequestId: 'r2' }),
			onReview: vi.fn(),
		});
		expect(container).not.toBeEmptyDOMElement();
		expect(screen.getByTestId('defunct-strip')).toBeInTheDocument();
	});

	it('shows a warning icon on the defunct strip', () => {
		renderStrip({
			simulation: makeSim(SimulationState.Ready),
			request: makeRequest({ supersededByRequestId: 'r2' }),
			onReview: vi.fn(),
		});
		expect(screen.getByTestId('defunct-icon')).toBeInTheDocument();
	});

	it('shows "Outdated tilecast" label on defunct strip', () => {
		renderStrip({
			simulation: makeSim(SimulationState.Ready),
			request: makeRequest({ supersededByRequestId: 'r2' }),
			onReview: vi.fn(),
		});
		expect(screen.getByText(/outdated tilecast/i)).toBeInTheDocument();
	});

	it('includes change count when simulation has preview actions', () => {
		renderStrip({
			simulation: makeSim(SimulationState.Ready, {
				previewActions: [
					{ actionId: 'a', vibePreviewId: 'p1' },
					{ actionId: 'b', vibePreviewId: 'p1' },
				],
			}),
			request: makeRequest({ supersededByRequestId: 'r2' }),
			onReview: vi.fn(),
		});
		expect(screen.getByText(/2 changes/i)).toBeInTheDocument();
	});

	it('renders a Review button on the defunct strip when simulation is Ready', () => {
		renderStrip({
			simulation: makeSim(SimulationState.Ready),
			request: makeRequest({ supersededByRequestId: 'r2' }),
			onReview: vi.fn(),
		});
		expect(screen.getByTestId('defunct-review-button')).toBeInTheDocument();
	});

	it('calls onReview when the defunct Review button is clicked', () => {
		const onReview = vi.fn();
		renderStrip({
			simulation: makeSim(SimulationState.Ready),
			request: makeRequest({ supersededByRequestId: 'r2' }),
			onReview,
		});
		fireEvent.click(screen.getByTestId('defunct-review-button'));
		expect(onReview).toHaveBeenCalledTimes(1);
	});

	it('shows defunct strip when simulation.isStale is true (even without supersededByRequestId)', () => {
		renderStrip({
			simulation: makeSim(SimulationState.Ready, { isStale: true }),
			request: makeRequest(),
			onReview: vi.fn(),
		});
		expect(screen.getByTestId('defunct-strip')).toBeInTheDocument();
		expect(screen.getByText(/outdated tilecast/i)).toBeInTheDocument();
	});

	it('shows the updating strip (not defunct) when a stale simulation is still Processing', () => {
		// A stale forecast that is still Processing is being recomputed, so it
		// is regenerating rather than defunct — the user should see
		// "Updating tilecast…", never "Outdated tilecast".
		renderStrip({
			simulation: makeSim(SimulationState.Processing, { isStale: true }),
			request: makeRequest(),
			onReview: vi.fn(),
		});
		expect(screen.getByTestId('updating-strip')).toBeInTheDocument();
		expect(screen.queryByTestId('defunct-strip')).not.toBeInTheDocument();
	});

	it('shows defunct strip with no Review button when a settled non-Ready sim is stale', () => {
		// Failed is settled (not in-progress), so a stale/superseded Failed
		// forecast is genuinely defunct — but there is nothing to review.
		renderStrip({
			simulation: makeSim(SimulationState.Failed, { isStale: true }),
			request: makeRequest(),
			onReview: vi.fn(),
		});
		expect(screen.getByTestId('defunct-strip')).toBeInTheDocument();
		expect(screen.queryByTestId('defunct-review-button')).not.toBeInTheDocument();
	});

	it('renders nothing when request.isClosed is true (changes accepted)', () => {
		const { container } = renderStrip({
			simulation: makeSim(SimulationState.Ready),
			request: makeRequest({ isClosed: true }),
			onReview: vi.fn(),
		});
		expect(container).toBeEmptyDOMElement();
	});

	it('renders nothing when request.state is "Executed"', () => {
		const { container } = renderStrip({
			simulation: makeSim(SimulationState.Ready),
			request: makeRequest({ state: 'Executed' }),
			onReview: vi.fn(),
		});
		expect(container).toBeEmptyDOMElement();
	});

	it('still shows defunct strip when superseded even if simulation is Ready', () => {
		const { container } = renderStrip({
			simulation: makeSim(SimulationState.Ready),
			request: makeRequest({ supersededByRequestId: 'r2', isClosed: false }),
			onReview: vi.fn(),
		});
		// superseded but NOT closed/executed → defunct strip visible
		expect(container).not.toBeEmptyDOMElement();
		expect(screen.getByTestId('defunct-strip')).toBeInTheDocument();
	});

	it('shows loading spinner inside the Review button when isLoadingReview is true', () => {
		renderStrip({
			simulation: makeSim(SimulationState.Ready),
			request: makeRequest({ supersededByRequestId: 'r2' }),
			onReview: vi.fn(),
			isLoadingReview: true,
		});
		expect(screen.getByTestId('review-loading-spinner')).toBeInTheDocument();
		// defunct context icon remains visible
		expect(screen.getByTestId('defunct-icon')).toBeInTheDocument();
	});

	it('shows "Loading tilecast…" inside the button while loading', () => {
		renderStrip({
			simulation: makeSim(SimulationState.Ready),
			request: makeRequest({ supersededByRequestId: 'r2' }),
			onReview: vi.fn(),
			isLoadingReview: true,
		});
		// loading text appears inside the button
		const button = screen.getByTestId('defunct-review-button');
		expect(button).toHaveTextContent(/loading tilecast/i);
		// defunct context label still shown in the message
		expect(screen.getByText(/outdated tilecast/i)).toBeInTheDocument();
	});

	it('disables the defunct Review button while loading', () => {
		renderStrip({
			simulation: makeSim(SimulationState.Ready),
			request: makeRequest({ supersededByRequestId: 'r2' }),
			onReview: vi.fn(),
			isLoadingReview: true,
		});
		expect(screen.getByTestId('defunct-review-button')).toBeDisabled();
	});
});
