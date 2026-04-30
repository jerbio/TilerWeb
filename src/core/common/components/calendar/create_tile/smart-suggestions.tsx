import React from 'react';
import styled, { keyframes } from 'styled-components';
import { Bookmark, MapPin, Sparkles } from 'lucide-react';
import {
	TilePredictionResponse,
	TilePredictionLocation,
	LocationSource,
} from '@/core/common/types/schedule';

export type SmartSuggestionsProps = {
	prediction: TilePredictionResponse | null;
	isLoading: boolean;
	isExpanded: boolean;
	appliedDurationMs: number | null;
	appliedLocationId: string | null;
	appliedTimeSection: string | null;
	restrictionProfileApplied: boolean;
	onDurationSelect: (hours: number, mins: number, ms: number) => void;
	onLocationSelect: (location: TilePredictionLocation) => void;
	onTimeSectionSelect: (section: string) => void;
	onApplyRestrictionProfile: (
		profile: NonNullable<NonNullable<TilePredictionResponse['timeOfDay']>['restrictionProfile']>
	) => void;
};

function msToHoursAndMins(ms: number): { hours: number; mins: number } {
	const totalMins = Math.round(ms / 60000);
	return { hours: Math.floor(totalMins / 60), mins: totalMins % 60 };
}

function formatDuration(ms: number): string {
	const { hours, mins } = msToHoursAndMins(ms);
	if (hours === 0) return `${mins} min`;
	if (mins === 0) return `${hours} hr`;
	return `${hours} hr ${mins} min`;
}

const SmartSuggestions: React.FC<SmartSuggestionsProps> = ({
	prediction,
	isLoading,
	isExpanded,
	appliedDurationMs,
	appliedLocationId,
	appliedTimeSection,
	restrictionProfileApplied,
	onDurationSelect,
	onLocationSelect,
	onTimeSectionSelect,
	onApplyRestrictionProfile,
}) => {
	const hasDuration = (prediction?.duration?.length ?? 0) > 0;
	const hasTimeOfDay = (prediction?.timeOfDay?.daySections?.length ?? 0) > 0;
	const hasLocation = (prediction?.location?.length ?? 0) > 0;
	const hasRestrictionProfile = !!prediction?.timeOfDay?.restrictionProfile && isExpanded;
	const hasContextBadges =
		isExpanded &&
		(!!prediction?.physicalStatus ||
			!!prediction?.emotionalStatus ||
			!!prediction?.weatherAffected);

	const hasAnything =
		hasDuration || hasTimeOfDay || hasLocation || hasRestrictionProfile || hasContextBadges;

	if (!isLoading && !hasAnything) return null;

	return (
		<Container>
			<Header>
				<Sparkles size={13} />
				<span>Smart Suggestions</span>
			</Header>

			{isLoading && (
				<LoadingRow>
					<SkeletonChip $width="64px" $delay="0s" />
					<SkeletonChip $width="80px" $delay="0.1s" />
					<SkeletonChip $width="56px" $delay="0.2s" />
				</LoadingRow>
			)}

			{!isLoading && hasDuration && (
				<Row>
					<RowLabel>Suggested Duration</RowLabel>
					<ChipGroup>
						{prediction!.duration!.map((ms) => {
							const { hours, mins } = msToHoursAndMins(ms);
							const isSelected = appliedDurationMs === ms;
							return (
								<Chip
									key={ms}
									type="button"
									$selected={isSelected}
									onClick={() => onDurationSelect(hours, mins, ms)}
								>
									{formatDuration(ms)}
								</Chip>
							);
						})}
					</ChipGroup>
				</Row>
			)}

			{!isLoading && hasTimeOfDay && (
				<Row>
					<RowLabel>Suggested Time</RowLabel>
					<ChipGroup>
						{prediction!.timeOfDay!.daySections.map((section) => (
							<Chip
								key={section}
								type="button"
								$selected={appliedTimeSection === section}
								onClick={() => onTimeSectionSelect(section)}
							>
								{section}
							</Chip>
						))}
					</ChipGroup>
				</Row>
			)}

			{!isLoading && hasLocation && (
				<Row>
					<RowLabel>Suggested Location</RowLabel>
					<ChipGroup>
						{prediction!.location!.map((location) => {
							const isSaved =
								location.source !== LocationSource.Google && !location.isAdHoc;
							const isSelected = appliedLocationId === location.id;
							return (
								<LocationChip
									key={location.id}
									type="button"
									$selected={isSelected}
									onClick={() => onLocationSelect(location)}
								>
									{isSaved ? <Bookmark size={11} /> : <MapPin size={11} />}
									{location.nickname || location.address}
								</LocationChip>
							);
						})}
					</ChipGroup>
				</Row>
			)}

			{!isLoading && hasRestrictionProfile && (
				<Row>
					<RowLabel>Suggested Schedule Window</RowLabel>
					<ChipGroup>
						<Chip
							type="button"
							$selected={restrictionProfileApplied}
							onClick={() =>
								onApplyRestrictionProfile(
									prediction!.timeOfDay!.restrictionProfile!
								)
							}
						>
							Apply Suggested Schedule Window
						</Chip>
					</ChipGroup>
				</Row>
			)}

			{!isLoading && hasContextBadges && (
				<BadgeRow>
					{prediction!.physicalStatus && (
						<Badge title="Physical demand">{prediction!.physicalStatus}</Badge>
					)}
					{prediction!.emotionalStatus && (
						<Badge title="Emotional load">{prediction!.emotionalStatus}</Badge>
					)}
					{prediction!.weatherAffected && (
						<Badge title="Weather sensitivity">{prediction!.weatherAffected}</Badge>
					)}
				</BadgeRow>
			)}
		</Container>
	);
};

// ── Animations ────────────────────────────────────────────────

const fadeIn = keyframes`
	from { opacity: 0; transform: translateY(-4px); }
	to   { opacity: 1; transform: translateY(0); }
`;

const shimmer = keyframes`
	0%   { background-position: -200% 0; }
	100% { background-position: 200% 0; }
`;

// ── Styled components ─────────────────────────────────────────

const Container = styled.div`
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
	animation: ${fadeIn} 0.2s ease-out;
`;

const Header = styled.div`
	display: flex;
	align-items: center;
	gap: 0.3rem;
	font-size: ${({ theme }) => theme.typography.fontSize.xs};
	font-family: ${({ theme }) => theme.typography.fontFamily.urban};
	font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
	color: ${({ theme }) => theme.colors.text.muted};
	text-transform: uppercase;
	letter-spacing: 0.04em;
`;

const Row = styled.div`
	display: flex;
	flex-direction: column;
	gap: 0.3rem;
`;

const RowLabel = styled.span`
	font-size: ${({ theme }) => theme.typography.fontSize.xs};
	font-family: ${({ theme }) => theme.typography.fontFamily.urban};
	font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
	color: ${({ theme }) => theme.colors.text.secondary};
`;

const ChipGroup = styled.div`
	display: flex;
	flex-wrap: wrap;
	gap: 0.375rem;
`;

const Chip = styled.button<{ $selected: boolean }>`
	display: inline-flex;
	align-items: center;
	padding: 0.2rem 0.6rem;
	border-radius: 999px;
	border: 1px solid
		${({ theme, $selected }) =>
			$selected ? theme.colors.datepicker.dateSelectedBg : theme.colors.border.default};
	background: ${({ theme, $selected }) =>
		$selected ? theme.colors.datepicker.dateSelectedBg : theme.colors.background.card2};
	color: ${({ theme, $selected }) =>
		$selected ? theme.colors.datepicker.dateSelectedText : theme.colors.text.primary};
	font-size: ${({ theme }) => theme.typography.fontSize.xs};
	font-family: ${({ theme }) => theme.typography.fontFamily.urban};
	font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
	cursor: pointer;
	transition:
		background-color 0.15s,
		border-color 0.15s,
		color 0.15s;

	&:hover {
		background: ${({ theme, $selected }) =>
			$selected
				? theme.colors.datepicker.dateSelectedBg
				: theme.colors.datepicker.dateHoverBg};
		border-color: ${({ theme, $selected }) =>
			$selected
				? theme.colors.datepicker.dateSelectedBg
				: theme.colors.datepicker.dateHoverBg};
		color: ${({ theme, $selected }) =>
			$selected
				? theme.colors.datepicker.dateSelectedText
				: theme.colors.datepicker.dateHoverText};
	}
`;

const LocationChip = styled(Chip)`
	gap: 0.3rem;

	svg {
		flex-shrink: 0;
		color: ${({ theme, $selected }) =>
			$selected ? theme.colors.datepicker.dateSelectedText : theme.colors.text.muted};
	}
`;

const BadgeRow = styled.div`
	display: flex;
	flex-wrap: wrap;
	gap: 0.375rem;
`;

const Badge = styled.span`
	display: inline-flex;
	align-items: center;
	padding: 0.15rem 0.5rem;
	border-radius: 999px;
	background: ${({ theme }) => theme.colors.background.card2};
	border: 1px solid ${({ theme }) => theme.colors.border.subtle};
	color: ${({ theme }) => theme.colors.text.muted};
	font-size: ${({ theme }) => theme.typography.fontSize.xs};
	font-family: ${({ theme }) => theme.typography.fontFamily.urban};
`;

const LoadingRow = styled.div`
	display: flex;
	gap: 0.375rem;
`;

const SkeletonChip = styled.div<{ $width: string; $delay: string }>`
	height: 24px;
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
	animation-delay: ${({ $delay }) => $delay};
`;

export default SmartSuggestions;
