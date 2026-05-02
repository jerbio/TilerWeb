import React, { useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { TilePredictionLocation, TilePredictionResponse } from '@/core/common/types/schedule';
import { DurationChipRow, LocationChipRow } from './suggestion-chip-row';

export type NudgePillProps = {
	prediction: TilePredictionResponse | null;
	isLoading: boolean;
	appliedDurationMs: number | null;
	appliedLocationId: string | null;
	appliedTimeSection: string | null;
	onDurationSelect: (hours: number, mins: number, ms: number) => void;
	onLocationSelect: (location: TilePredictionLocation) => void;
	onTimeSectionSelect: (section: string) => void;
};

const NudgePill: React.FC<NudgePillProps> = ({
	prediction,
	isLoading,
	appliedDurationMs,
	appliedLocationId,
	onDurationSelect,
	onLocationSelect,
}) => {
	const { t } = useTranslation();
	const [expanded, setExpanded] = useState(false);

	const msToLabel = (ms: number): string => {
		const totalMins = Math.round(ms / 60000);
		const hours = Math.floor(totalMins / 60);
		const mins = totalMins % 60;
		if (hours === 0) return t('calendar.createTile.suggestions.duration.mins', { mins });
		if (mins === 0) return t('calendar.createTile.suggestions.duration.hrs', { hours });
		return t('calendar.createTile.suggestions.duration.hrsAndMins', { hours, mins });
	};

	const durations = prediction?.duration ?? [];
	const locations = prediction?.location ?? [];

	const previewLabels = [
		...locations.slice(0, 1).map((l) => l.nickname || l.address),
		...durations.slice(0, 1).map(msToLabel),
	];

	const totalCount = durations.length + locations.length;

	if (isLoading) {
		return (
			<PillShell>
				<PillBar $expanded={false} as="div">
					<Sparkles size={12} />
					<SkeletonText $width="120px" />
				</PillBar>
			</PillShell>
		);
	}

	if (!prediction || totalCount === 0) return null;

	return (
		<PillShell>
			<PillBar $expanded={expanded} onClick={() => setExpanded((e) => !e)}>
				<Sparkles size={12} />
				<PillSummary>
					{t('calendar.createTile.suggestions.count', { count: totalCount })}
				</PillSummary>
				{!expanded && previewLabels.length > 0 && (
					<PreviewChips>
						{previewLabels.map((label) => (
							<MiniChip key={label}>{label}</MiniChip>
						))}
					</PreviewChips>
				)}
				{expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
			</PillBar>

			{expanded && (
				<PillBody>
					{durations.length > 0 && (
						<DurationChipRow
							durations={durations}
							appliedMs={appliedDurationMs}
							onSelect={onDurationSelect}
						/>
					)}
					{locations.length > 0 && (
						<LocationChipRow
							locations={locations}
							appliedId={appliedLocationId}
							onSelect={onLocationSelect}
						/>
					)}
					{/* {timeSections.length > 0 && (
						<TimeSectionChipRow
							sections={timeSections}
							appliedSection={appliedTimeSection}
							onSelect={onTimeSectionSelect}
						/>
					)} */}
				</PillBody>
			)}
		</PillShell>
	);
};

const fadeIn = keyframes`
	from { opacity: 0; transform: translateY(-4px); }
	to   { opacity: 1; transform: translateY(0); }
`;

const shimmer = keyframes`
	0%   { background-position: -200% 0; }
	100% { background-position:  200% 0; }
`;

const PillShell = styled.div`
	border: 1px solid ${({ theme }) => theme.colors.border.subtle};
	border-radius: ${({ theme }) => theme.borderRadius.large};
	overflow: hidden;
	animation: ${fadeIn} 0.2s ease-out;
	margin-bottom: 0.5rem;
`;

const PillBar = styled.button<{ $expanded: boolean }>`
	width: 100%;
	display: flex;
	align-items: center;
	gap: 0.4rem;
	padding: 0.35rem 0.75rem;
	background: ${({ theme }) => theme.colors.background.card2};
	border: none;
	cursor: pointer;
	color: ${({ theme }) => theme.colors.text.muted};

	svg {
		flex-shrink: 0;
		color: ${({ theme }) => theme.colors.text.muted};
	}

	${({ $expanded, theme }) =>
		$expanded && `border-bottom: 1px solid ${theme.colors.border.subtle};`}
`;

const PillSummary = styled.span`
	font-size: ${({ theme }) => theme.typography.fontSize.xs};
	font-family: ${({ theme }) => theme.typography.fontFamily.urban};
	font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
	white-space: nowrap;
`;

const PreviewChips = styled.div`
	display: flex;
	gap: 0.25rem;
	flex: 1;
	overflow: hidden;
`;

const MiniChip = styled.span`
	padding: 0.1rem 0.45rem;
	border-radius: 999px;
	font-size: ${({ theme }) => theme.typography.fontSize.xs};
	font-family: ${({ theme }) => theme.typography.fontFamily.urban};
	background: ${({ theme }) => theme.colors.background.card};
	border: 1px solid ${({ theme }) => theme.colors.border.default};
	color: ${({ theme }) => theme.colors.text.secondary};
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
	max-width: 80px;
`;

const PillBody = styled.div`
	display: flex;
	flex-direction: column;
	gap: 0.25rem;
	padding: 0.5rem 0.75rem;
	background: ${({ theme }) => theme.colors.background.card};
	animation: ${fadeIn} 0.15s ease-out;
`;

const SkeletonText = styled.div<{ $width: string }>`
	height: 10px;
	width: ${({ $width }) => $width};
	border-radius: 999px;
	background: linear-gradient(
		90deg,
		${({ theme }) => theme.colors.background.card2} 25%,
		${({ theme }) => theme.colors.border.default} 50%,
		${({ theme }) => theme.colors.background.card2} 75%
	);
	background-size: 200% 100%;
	animation: ${shimmer} 1.6s ease-in-out infinite;
`;

export default NudgePill;
