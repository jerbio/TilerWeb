import React from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import { SimulationDiffCounts } from '@/core/util/simulationDiff';
import { ComparisonView } from '@/core/state/simulationOverlayStore';

// ---------------------------------------------------------------------------
// Phase 5 — Simulation mode banner
// ---------------------------------------------------------------------------
// Sits above the calendar grid while the user is in review. Surfaces the
// `[Current | Simulation]` toggle (radiogroup), aggregate diff counts, and
// an Exit-review button. Pure presentational — all state lives in the
// `simulationOverlayStore`.
// ---------------------------------------------------------------------------

interface SimulationModeBannerProps {
	counts: SimulationDiffCounts;
	comparisonView: ComparisonView;
	onComparisonViewChange: (v: ComparisonView) => void;
	onExitReview: () => void;
}

const Wrapper = styled.div`
	display: flex;
	align-items: center;
	gap: 12px;
	flex-wrap: wrap;
	padding: 8px 12px;
	background: rgba(60, 110, 240, 0.08);
	border: 1px solid rgba(60, 110, 240, 0.35);
	border-radius: 8px;
	margin-bottom: 8px;
	font-size: 13px;
`;

const Toggle = styled.div`
	display: inline-flex;
	border: 1px solid rgba(0, 0, 0, 0.15);
	border-radius: 999px;
	overflow: hidden;
`;

const ToggleButton = styled.button<{ $active: boolean }>`
	background: ${({ $active }) => ($active ? 'rgba(60, 110, 240, 0.85)' : 'transparent')};
	color: ${({ $active }) => ($active ? '#fff' : 'inherit')};
	border: none;
	padding: 4px 12px;
	font-size: 12px;
	cursor: pointer;
	&:focus-visible {
		outline: 2px solid rgba(60, 110, 240, 0.9);
		outline-offset: 2px;
	}
`;

const Counts = styled.div`
	display: inline-flex;
	gap: 10px;
	color: ${({ theme }) => theme.colors.text};
	opacity: 0.85;
`;

const Spacer = styled.div`
	flex: 1 1 auto;
`;

const ExitButton = styled.button`
	background: transparent;
	border: 1px solid rgba(0, 0, 0, 0.2);
	border-radius: 6px;
	padding: 4px 10px;
	font-size: 12px;
	cursor: pointer;
	&:hover {
		background: rgba(0, 0, 0, 0.05);
	}
`;

const SimulationModeBanner: React.FC<SimulationModeBannerProps> = ({
	counts,
	comparisonView,
	onComparisonViewChange,
	onExitReview,
}) => {
	const { t } = useTranslation();
	const exitLabel = t('home.expanded.chat.exitReview', { defaultValue: 'Exit review' });
	const currentLabel = t('home.expanded.chat.viewCurrent', { defaultValue: 'Current' });
	const simulationLabel = t('home.expanded.chat.viewSimulation', {
		defaultValue: 'Simulation',
	});
	// Plan §5.4 / §5.5 — empty-diff banner text.
	const isEmptyDiff =
		counts.added + counts.removed + counts.edited + counts.shifted + counts.conflicts === 0;
	const emptyLabel = t('home.expanded.chat.simulationNoChangesInView', {
		defaultValue: 'No changes in this view',
	});

	return (
		<Wrapper role="status" aria-live="polite" aria-label="Simulation mode banner">
			<Toggle role="radiogroup" aria-label="Schedule comparison view">
				<ToggleButton
					$active={comparisonView === 'current'}
					role="radio"
					aria-checked={comparisonView === 'current'}
					onClick={() => onComparisonViewChange('current')}
				>
					{currentLabel}
				</ToggleButton>
				<ToggleButton
					$active={comparisonView === 'simulation'}
					role="radio"
					aria-checked={comparisonView === 'simulation'}
					onClick={() => onComparisonViewChange('simulation')}
				>
					{simulationLabel}
				</ToggleButton>
			</Toggle>
			{isEmptyDiff ? (
				<Counts>
					<span>{emptyLabel}</span>
				</Counts>
			) : (
				<Counts>
					<span>+{counts.added}</span>
					<span>−{counts.removed}</span>
					<span>~{counts.edited + counts.shifted}</span>
					{counts.conflicts > 0 && (
						<span style={{ color: 'rgb(190, 100, 0)' }}>!{counts.conflicts}</span>
					)}
				</Counts>
			)}
			<Spacer />
			<ExitButton onClick={onExitReview}>{exitLabel}</ExitButton>
		</Wrapper>
	);
};

export default SimulationModeBanner;
