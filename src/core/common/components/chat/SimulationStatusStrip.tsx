import React from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import Button from '@/core/common/components/button';
import { SimulationDto, SimulationState, VibeRequest } from '@/core/common/types/chat';
import { isRequestTerminal } from '@/core/util/simulationSelectors';

interface SimulationStatusStripProps {
	simulation: SimulationDto | null;
	request: VibeRequest | null;
	onReview: () => void;
	onRetry?: () => void;
	/**
	 * Plan §5.5 — set when the lazy-fetch in `enterReview()` failed. When
	 * truthy, render "Tilecast unavailable" + Retry instead of the normal
	 * Ready-state strip. The user is NOT in review mode in this case.
	 */
	fetchError?: string | null;
	/**
	 * True while the user-initiated `enterReview()` fetch is in flight.
	 * Replaces the Review button with a spinner + label so the user gets
	 * immediate visual feedback after clicking. Background prefetches do
	 * NOT set this flag — they remain silent.
	 */
	isLoadingReview?: boolean;
	/**
	 * When provided and `showAccept` is true, the Ready-state strip renders
	 * an "Accept Changes" button next to the Review button so the two
	 * primary CTAs share a single line.
	 */
	onAccept?: () => void;
	showAccept?: boolean;
	isAccepting?: boolean;
}

const Strip = styled.div`
	display: flex;
	align-items: center;
	gap: 8px;
	padding: 6px 10px;
	font-size: 12px;
	color: ${({ theme }) => theme.colors?.text ?? 'inherit'};
`;

const Spinner = styled.span`
	width: 12px;
	height: 12px;
	border: 2px solid currentColor;
	border-top-color: transparent;
	border-radius: 50%;
	display: inline-block;
	animation: spin 0.8s linear infinite;
	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
`;

const Message = styled.span`
	flex: 1;
	min-width: 0;
`;

/**
 * Compact status strip rendered above the action pill row. Communicates
 * simulation lifecycle to the user without ever gating Apply (Apply lives
 * elsewhere and is intentionally simulation-agnostic).
 *
 * State table — see Phase 3.3 of SIMULATED_SCHEDULE_EXPERIENCE_EXECUTION_PLAN.md.
 */
const SimulationStatusStrip: React.FC<SimulationStatusStripProps> = ({
	simulation,
	request,
	onReview,
	onRetry,
	fetchError,
	isLoadingReview,
	onAccept,
	showAccept,
	isAccepting,
}) => {
	const { t } = useTranslation();

	// Plan §5.5 — lazy-fetch failure takes precedence over normal lifecycle
	// rows. Render the unavailable state with Retry regardless of the
	// underlying simulation.state (which may still be 'Ready' server-side).
	if (fetchError) {
		return (
			<Strip role="status" aria-live="polite">
				<Message>
					{t('home.expanded.chat.simulationUnavailable', 'Simulation unavailable')}
				</Message>
				{onRetry && (
					<Button variant="ghost" height={28} onClick={onRetry}>
						{t('home.expanded.chat.retry', 'Retry')}
					</Button>
				)}
			</Strip>
		);
	}

	// Hidden cases — no strip at all.
	if (simulation?.state === SimulationState.Invalidated) return null;
	// No active request and no simulation → nothing to communicate. This
	// is the home-page first-paint state (chat session not yet hydrated,
	// or session has no in-flight request). Without this guard the
	// no-simulation branch below would render "Simulation starting…"
	// unconditionally on app load.
	if (!simulation && !request) return null;
	if (!simulation && isRequestTerminal(request)) return null;
	// Plan §6.6.3 — if a newer request has superseded this one, the
	// embedded simulation (even when 'Ready') is historical. Hide the
	// strip so the user isn't invited to review/apply a stale preview.
	if (request?.supersededByRequestId) return null;

	// No simulation row yet — request is fresh, generation hasn't started server-side.
	if (!simulation) {
		return (
			<Strip role="status" aria-live="polite">
				<Spinner data-testid="simulation-spinner" aria-hidden="true" />
				<Message>
					{t('home.expanded.chat.simulationStarting', 'Simulation starting…')}
				</Message>
			</Strip>
		);
	}

	if (simulation.state === SimulationState.Queued) {
		return (
			<Strip role="status" aria-live="polite">
				<Spinner data-testid="simulation-spinner" aria-hidden="true" />
				<Message>{t('home.expanded.chat.simulationQueued', 'Simulation queued…')}</Message>
			</Strip>
		);
	}

	if (simulation.state === SimulationState.Processing) {
		return (
			<Strip role="status" aria-live="polite">
				<Spinner data-testid="simulation-spinner" aria-hidden="true" />
				<Message>
					{t('home.expanded.chat.simulationGenerating', 'Generating simulation…')}
				</Message>
			</Strip>
		);
	}

	if (simulation.state === SimulationState.Ready) {
		const count = simulation.previewActions?.length ?? 0;
		const reviewLabel = t('home.expanded.chat.reviewSimulation', 'Review tilecast');
		return (
			<Strip role="status" aria-live="polite">
				{/*
				 * Color rationale: amber (warning.500 #F79009) is the
				 * traffic-light "yield" hue — historically read as a
				 * transitive state between go (green/primary CTA) and
				 * stop (red/destructive). It connotes "pause and
				 * evaluate", which matches the review/preview flow
				 * (the tilecast is a forecast, not yet committed).
				 * Using a string variant override here so we don't
				 * pollute the global Button variant enum for a
				 * one-off semantic CTA.
				 */}
				<Button
					variant="#F79009"
					height={28}
					onClick={onReview}
					disabled={isLoadingReview || isAccepting}
					aria-busy={isLoadingReview || undefined}
					data-testid="review-simulation-button"
				>
					{isLoadingReview ? (
						<>
							<Spinner data-testid="review-loading-spinner" aria-hidden="true" />
							<span style={{ marginLeft: 6 }}>
								{t('home.expanded.chat.loadingSimulation', 'Loading tilecast…')}
							</span>
						</>
					) : (
						<>
							{reviewLabel} · {count}{' '}
							{t('home.expanded.chat.simulationChangesLabel', 'changes')}
						</>
					)}
				</Button>
				{showAccept && onAccept && (
					<Button
						variant="primary"
						height={28}
						onClick={onAccept}
						disabled={isAccepting || isLoadingReview}
						aria-busy={isAccepting || undefined}
						data-onboarding-accept-button
					>
						{t('home.expanded.chat.acceptChanges', 'Accept Changes')}
					</Button>
				)}
			</Strip>
		);
	}

	if (simulation.state === SimulationState.Failed) {
		return (
			<Strip role="status" aria-live="polite">
				<Message>
					{t('home.expanded.chat.simulationFailed', 'Simulation unavailable')}
				</Message>
				{onRetry && (
					<Button variant="ghost" height={28} onClick={onRetry}>
						{t('home.expanded.chat.retry', 'Retry')}
					</Button>
				)}
			</Strip>
		);
	}

	return null;
};

export default SimulationStatusStrip;
