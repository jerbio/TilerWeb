import React from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import { SimulationDiffCounts } from '@/core/util/simulationDiff';
import { ComparisonView, KindFilter } from '@/core/state/simulationOverlayStore';

// ---------------------------------------------------------------------------
// Phase 5 — Simulation mode banner
// ---------------------------------------------------------------------------

interface SimulationModeBannerProps {
	counts: SimulationDiffCounts;
	comparisonView: ComparisonView;
	onComparisonViewChange: (v: ComparisonView) => void;
	onExitReview: () => void;
	activeKindFilter?: KindFilter | null;
	onKindFilterChange?: (filter: KindFilter) => void;
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
	gap: 6px;
	align-items: center;
`;

const FilterChip = styled.button<{ $color: string; $active: boolean }>`
	display: inline-flex;
	align-items: center;
	padding: 2px 8px;
	border-radius: 999px;
	border: 1.5px solid ${({ $color }) => $color};
	background: ${({ $color, $active }) => ($active ? $color : 'transparent')};
	color: ${({ $color, $active }) => ($active ? '#fff' : $color)};
	font-size: 12px;
	font-weight: 600;
	cursor: pointer;
	transition:
		background 0.15s ease,
		color 0.15s ease;
	&:focus-visible {
		outline: 2px solid ${({ $color }) => $color};
		outline-offset: 2px;
	}
`;

const Legend = styled.div`
	display: none;
	@media (max-width: 768px) {
		display: flex;
		flex-basis: 100%;
		gap: 10px;
		font-size: 10px;
		opacity: 0.6;
		color: ${({ theme }) => theme.colors.text.secondary};
	}
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
	activeKindFilter = null,
	onKindFilterChange,
}) => {
	const { t } = useTranslation();
	const exitLabel = t('home.expanded.chat.exitReview', { defaultValue: 'Exit review' });
	const currentLabel = t('home.expanded.chat.viewCurrent', { defaultValue: 'Current' });
	const simulationLabel = t('home.expanded.chat.viewSimulation', {
		defaultValue: 'Simulation',
	});
	const isEmptyDiff =
		counts.added + counts.removed + counts.edited + counts.shifted + counts.conflicts === 0;
	const emptyLabel = t('home.expanded.chat.simulationNoChangesInView', {
		defaultValue: 'No changes in this view',
	});

	const updatedCount = counts.edited + counts.shifted;

	const chips: Array<{
		kind: KindFilter;
		glyph: string;
		count: number;
		color: string;
		title: string;
	}> = [
		{
			kind: 'new',
			glyph: '+',
			count: counts.added,
			color: 'rgba(22,163,74,0.9)',
			title: `${counts.added} tile${counts.added === 1 ? '' : 's'} added`,
		},
		{
			kind: 'removed',
			glyph: '\u00D7',
			count: counts.removed,
			color: 'rgba(220,38,38,0.9)',
			title: `${counts.removed} tile${counts.removed === 1 ? '' : 's'} removed`,
		},
		{
			kind: 'updated',
			glyph: '\u2192',
			count: updatedCount,
			color: 'rgba(37,99,235,0.9)',
			title: `${updatedCount} tile${updatedCount === 1 ? '' : 's'} moved`,
		},
		{
			kind: 'conflict',
			glyph: '\u26A0',
			count: counts.conflicts,
			color: 'rgba(220,38,38,0.9)',
			title: `${counts.conflicts} conflict${counts.conflicts === 1 ? '' : 's'}`,
		},
	];

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
					{chips
						.filter((c) => c.count > 0)
						.map((c) => (
							<FilterChip
								key={c.kind}
								$color={c.color}
								$active={activeKindFilter === c.kind}
								aria-pressed={activeKindFilter === c.kind ? 'true' : 'false'}
								title={c.title}
								data-testid={`filter-chip-${c.kind}`}
								onClick={() => onKindFilterChange?.(c.kind)}
							>
								{c.glyph}
								{c.count}
							</FilterChip>
						))}
				</Counts>
			)}
			<Legend data-testid="kind-legend">
				<span style={{ color: 'rgba(22,163,74,0.9)' }}>+ added</span>
				<span style={{ color: 'rgba(220,38,38,0.9)' }}>× removed</span>
				<span style={{ color: 'rgba(37,99,235,0.9)' }}>→ moved</span>
				<span style={{ color: 'rgba(220,38,38,0.9)' }}>⚠ conflict</span>
			</Legend>
			<Spacer />
			<ExitButton onClick={onExitReview}>{exitLabel}</ExitButton>
		</Wrapper>
	);
};

export default SimulationModeBanner;
