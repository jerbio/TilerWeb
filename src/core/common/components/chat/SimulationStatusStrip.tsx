import React from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import { AlertCircle } from 'lucide-react';
import Button from '@/core/common/components/button';
import { SimulationDto, SimulationState, VibeRequest } from '@/core/common/types/chat';
import { isRequestTerminal, isSimulationInProgress } from '@/core/util/simulationSelectors';

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
	/**
	 * True while a fresh forecast is being (re)generated because the previous
	 * one was superseded — e.g. the user just sent a follow-up message. When
	 * set, the strip shows the transient "Updating tilecast…" row instead of
	 * the stale "Outdated tilecast" state or the (now historical) Ready CTA.
	 * This prevents the yellow-Review → defunct flash on send.
	 */
	isRegenerating?: boolean;
}

const Strip = styled.div`
	display: flex;
	align-items: center;
	flex-wrap: wrap;
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

const DefunctStrip = styled(Strip)`
	opacity: 0.65;
	color: ${({ theme }) => theme.colors.text.secondary};
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
	isRegenerating,
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

	// Hidden cases — no strip at all. These always win: an accepted, closed,
	// or invalidated request has nothing to communicate regardless of any
	// pending regeneration.
	if (simulation?.state === SimulationState.Invalidated) return null;
	if (request?.isClosed || request?.state?.toLowerCase() === 'executed') return null;

	// Lifecycle derivation. Ordering matters: an actively (re)generating
	// forecast must win over the "defunct" (stale/superseded) state — a fresh
	// tilecast on the way is the opposite of outdated. `isDefunct` is only a
	// real dead-end once the forecast has settled (Ready) and nothing newer
	// is being computed.
	const inProgress = isSimulationInProgress(simulation); // Queued | Processing
	const isDefunct = !!request?.supersededByRequestId || simulation?.isStale === true;
	// Regenerating: an explicit signal from chat (follow-up sent, new preview
	// pending) OR a stale/superseded forecast that is still being recomputed.
	const isRegen = !!isRegenerating || (inProgress && isDefunct);

	// (Re)generation in flight — transient "Updating tilecast…" row. Takes
	// precedence over defunct AND over the Ready CTA to eliminate the
	// yellow-Review → defunct flash when a follow-up message is sent. This is
	// evaluated before the remaining "no simulation" hidden guards so a
	// superseded request whose fresh forecast is still loading (simulation
	// briefly null) bridges to "Updating…" instead of vanishing.
	if (isRegen) {
		return (
			<Strip role="status" aria-live="polite" data-testid="updating-strip">
				<Spinner data-testid="simulation-spinner" aria-hidden="true" />
				<Message>
					{t('home.expanded.chat.simulationUpdating', 'Updating tilecast…')}
				</Message>
			</Strip>
		);
	}

	// Remaining hidden cases — nothing in flight to communicate.
	if (!simulation && !request) return null;
	if (!simulation && isRequestTerminal(request)) return null;

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

	// Defunct: a newer request superseded this one, or the server flagged the
	// simulation as stale, AND no regeneration is pending (checked above). Show
	// a muted warning strip instead of hiding — the user should know the
	// tilecast is outdated even if they choose to peek at it.
	if (isDefunct) {
		const count = simulation?.previewActions?.length ?? 0;
		return (
			<DefunctStrip role="status" aria-live="polite" data-testid="defunct-strip">
				<AlertCircle
					size={13}
					strokeWidth={2}
					data-testid="defunct-icon"
					aria-hidden="true"
				/>
				<Message>
					{t('home.expanded.chat.simulationDefunct', 'Outdated tilecast')}
					{count > 0 &&
						` · ${count} ${t('home.expanded.chat.simulationChangesLabel', 'changes')}`}
				</Message>
				{simulation?.state === SimulationState.Ready && (
					<Button
						variant="ghost"
						height={28}
						onClick={onReview}
						disabled={isLoadingReview}
						aria-busy={isLoadingReview || undefined}
						data-testid="defunct-review-button"
					>
						{isLoadingReview ? (
							<>
								<Spinner data-testid="review-loading-spinner" aria-hidden="true" />
								<span style={{ marginLeft: 6 }}>
									{t('home.expanded.chat.loadingSimulation', 'Loading tilecast…')}
								</span>
							</>
						) : (
							t('home.expanded.chat.review', 'Review')
						)}
					</Button>
				)}
			</DefunctStrip>
		);
	}

	if (simulation.state === SimulationState.Ready) {
		const count = simulation.previewActions?.length ?? 0;
		const reviewLabel = t('home.expanded.chat.reviewSimulation', 'Review tilecast');
		// When the Accept CTA shares the row, both pills compete for the narrow
		// side-panel width. Drop to a compact "Review · N" label so neither pill
		// has to wrap its text (which would break the fixed button height).
		const compactReview = !!(showAccept && onAccept);
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
					style={{ whiteSpace: 'nowrap', flexShrink: 0 }}
				>
					{isLoadingReview ? (
						<>
							<Spinner data-testid="review-loading-spinner" aria-hidden="true" />
							<span style={{ marginLeft: 6 }}>
								{t('home.expanded.chat.loadingSimulation', 'Loading tilecast…')}
							</span>
						</>
					) : compactReview ? (
						<>
							{t('home.expanded.chat.review', 'Review')} · {count}
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
						style={{ whiteSpace: 'nowrap', flexShrink: 0 }}
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
