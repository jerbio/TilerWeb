import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
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

/**
 * Transition behavior — a tilecast that is actively (re)generating must NEVER
 * be labelled "Outdated". A fresh forecast on the way is the opposite of
 * outdated. The "Updating tilecast…" row takes precedence over the defunct
 * (stale/superseded) row and over the Ready CTA while regeneration is pending.
 */
describe('SimulationStatusStrip — regeneration beats defunct', () => {
	it('shows "Updating tilecast…" (not defunct) when a stale sim is still Processing', () => {
		renderStrip({
			simulation: makeSim(SimulationState.Processing, { isStale: true }),
			request: makeRequest(),
			onReview: vi.fn(),
		});
		expect(screen.getByTestId('updating-strip')).toBeInTheDocument();
		expect(screen.getByText(/updating tilecast/i)).toBeInTheDocument();
		expect(screen.queryByTestId('defunct-strip')).not.toBeInTheDocument();
	});

	it('shows "Updating tilecast…" (not defunct) when a superseded request is Queued', () => {
		renderStrip({
			simulation: makeSim(SimulationState.Queued),
			request: makeRequest({ supersededByRequestId: 'r2' }),
			onReview: vi.fn(),
		});
		expect(screen.getByTestId('updating-strip')).toBeInTheDocument();
		expect(screen.getByText(/updating tilecast/i)).toBeInTheDocument();
		expect(screen.queryByTestId('defunct-strip')).not.toBeInTheDocument();
	});

	it('shows a spinner on the updating strip', () => {
		renderStrip({
			simulation: makeSim(SimulationState.Processing, { isStale: true }),
			request: makeRequest(),
			onReview: vi.fn(),
		});
		expect(screen.getByTestId('simulation-spinner')).toBeInTheDocument();
	});

	it('regenerating flag beats a Ready+superseded snapshot (kills the yellow→defunct flash)', () => {
		// This is the flash case: the previous request is superseded and its
		// Ready preview is still in state, but chat has already kicked off a
		// fresh forecast. We must show "Updating…", not the yellow Review CTA
		// and not the defunct strip.
		renderStrip({
			simulation: makeSim(SimulationState.Ready),
			request: makeRequest({ supersededByRequestId: 'r2' }),
			onReview: vi.fn(),
			isRegenerating: true,
		});
		expect(screen.getByTestId('updating-strip')).toBeInTheDocument();
		expect(screen.queryByTestId('defunct-strip')).not.toBeInTheDocument();
		expect(screen.queryByTestId('review-simulation-button')).not.toBeInTheDocument();
	});

	it('regenerating flag with a cleared (null) simulation still shows "Updating tilecast…"', () => {
		// On send, chat clears the simulation synchronously while the new one
		// is fetched. With the regenerating flag set the strip should bridge
		// that gap with "Updating…" instead of flashing "starting" or defunct.
		renderStrip({
			simulation: null,
			request: makeRequest({ supersededByRequestId: 'r2' }),
			onReview: vi.fn(),
			isRegenerating: true,
		});
		expect(screen.getByTestId('updating-strip')).toBeInTheDocument();
		expect(screen.queryByTestId('defunct-strip')).not.toBeInTheDocument();
	});
});

describe('SimulationStatusStrip — defunct still applies when NOT regenerating', () => {
	it('shows the defunct strip for a Ready+superseded snapshot with no regeneration', () => {
		renderStrip({
			simulation: makeSim(SimulationState.Ready),
			request: makeRequest({ supersededByRequestId: 'r2' }),
			onReview: vi.fn(),
		});
		expect(screen.getByTestId('defunct-strip')).toBeInTheDocument();
		expect(screen.queryByTestId('updating-strip')).not.toBeInTheDocument();
	});

	it('shows the fresh Review CTA for a Ready, non-stale, non-superseded snapshot', () => {
		renderStrip({
			simulation: makeSim(SimulationState.Ready),
			request: makeRequest(),
			onReview: vi.fn(),
		});
		expect(screen.getByTestId('review-simulation-button')).toBeInTheDocument();
		expect(screen.queryByTestId('updating-strip')).not.toBeInTheDocument();
		expect(screen.queryByTestId('defunct-strip')).not.toBeInTheDocument();
	});

	it('keeps fresh "Generating simulation…" copy for a first-time (non-stale) Processing sim', () => {
		renderStrip({
			simulation: makeSim(SimulationState.Processing),
			request: makeRequest(),
			onReview: vi.fn(),
		});
		expect(screen.getByText(/generating simulation/i)).toBeInTheDocument();
		expect(screen.queryByTestId('updating-strip')).not.toBeInTheDocument();
	});
});
