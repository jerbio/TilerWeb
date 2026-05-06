import React from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import Button from '@/core/common/components/button';
import { SimulationDto, VibeRequest } from '@/core/common/types/chat';
import { isRequestTerminal } from '@/core/util/simulationSelectors';

interface SimulationStatusStripProps {
	simulation: SimulationDto | null;
	request: VibeRequest | null;
	onReview: () => void;
	onRetry?: () => void;
	/**
	 * Plan §5.5 — set when the lazy-fetch in `enterReview()` failed. When
	 * truthy, render "Simulation unavailable" + Retry instead of the normal
	 * Ready-state strip. The user is NOT in review mode in this case.
	 */
	fetchError?: string | null;
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
	if (simulation?.state === 'Invalidated') return null;
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

	if (simulation.state === 'Queued') {
		return (
			<Strip role="status" aria-live="polite">
				<Spinner data-testid="simulation-spinner" aria-hidden="true" />
				<Message>{t('home.expanded.chat.simulationQueued', 'Simulation queued…')}</Message>
			</Strip>
		);
	}

	if (simulation.state === 'Processing') {
		return (
			<Strip role="status" aria-live="polite">
				<Spinner data-testid="simulation-spinner" aria-hidden="true" />
				<Message>
					{t('home.expanded.chat.simulationGenerating', 'Generating simulation…')}
				</Message>
			</Strip>
		);
	}

	if (simulation.state === 'Ready') {
		const count = simulation.previewActions?.length ?? 0;
		return (
			<Strip role="status" aria-live="polite">
				<Message>
					{t('home.expanded.chat.simulationReady', 'Simulation ready')} · {count}{' '}
					{t('home.expanded.chat.simulationChangesLabel', 'changes')}
				</Message>
				<Button variant="ghost" height={28} onClick={onReview}>
					{t('home.expanded.chat.reviewSimulation', 'Review simulation')}
				</Button>
			</Strip>
		);
	}

	if (simulation.state === 'Failed') {
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
