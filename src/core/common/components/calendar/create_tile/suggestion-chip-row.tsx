import React from 'react';
import styled, { keyframes } from 'styled-components';
import { Bookmark, MapPin } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { TilePredictionLocation, LocationSource } from '@/core/common/types/schedule';

export type DurationChipRowProps = {
	durations: number[];
	appliedMs: number | null;
	onSelect: (hours: number, mins: number, ms: number) => void;
};

export type LocationChipRowProps = {
	locations: TilePredictionLocation[];
	appliedId: string | null;
	onSelect: (location: TilePredictionLocation) => void;
};

export type TimeSectionChipRowProps = {
	sections: string[];
	appliedSection: string | null;
	onSelect: (section: string) => void;
};

function msToHoursAndMins(ms: number) {
	const totalMins = Math.round(ms / 60000);
	return { hours: Math.floor(totalMins / 60), mins: totalMins % 60 };
}

export const DurationChipRow: React.FC<DurationChipRowProps> = ({
	durations,
	appliedMs,
	onSelect,
}) => {
	const { t } = useTranslation();
	const formatDuration = (ms: number): string => {
		const { hours, mins } = msToHoursAndMins(ms);
		if (hours === 0) return t('calendar.createTile.suggestions.duration.mins', { mins });
		if (mins === 0) return t('calendar.createTile.suggestions.duration.hrs', { hours });
		return t('calendar.createTile.suggestions.duration.hrsAndMins', { hours, mins });
	};
	return (
		<ChipRow>
			<SuggestLabel>✦</SuggestLabel>
			{durations.map((ms) => {
				const { hours, mins } = msToHoursAndMins(ms);
				return (
					<Chip
						key={ms}
						type="button"
						$selected={appliedMs === ms}
						onClick={() => onSelect(hours, mins, ms)}
					>
						{formatDuration(ms)}
					</Chip>
				);
			})}
		</ChipRow>
	);
};

export const LocationChipRow: React.FC<LocationChipRowProps> = ({
	locations,
	appliedId,
	onSelect,
}) => (
	<ChipRow>
		<SuggestLabel>✦</SuggestLabel>
		{locations.map((loc) => {
			const isSaved = loc.source !== LocationSource.Google && !loc.isAdHoc;
			return (
				<LocationChip
					key={loc.id}
					type="button"
					$selected={appliedId === loc.id}
					onClick={() => onSelect(loc)}
				>
					{isSaved ? <Bookmark size={10} /> : <MapPin size={10} />}
					{loc.nickname || loc.address}
				</LocationChip>
			);
		})}
	</ChipRow>
);

// export const TimeSectionChipRow: React.FC<TimeSectionChipRowProps> = ({
// 	sections,
// 	appliedSection,
// 	onSelect,
// }) => (
// 	<ChipRow>
// 		<SuggestLabel>✦</SuggestLabel>
// 		{sections.map((section) => (
// 			<Chip
// 				key={section}
// 				type="button"
// 				$selected={appliedSection === section}
// 				onClick={() => onSelect(section)}
// 			>
// 				{section}
// 			</Chip>
// 		))}
// 	</ChipRow>
// );

const ChipRow = styled.div`
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 0.3rem;
	margin-top: 0.375rem;
`;

const SuggestLabel = styled.span`
	font-size: ${({ theme }) => theme.typography.fontSize.xs};
	color: ${({ theme }) => theme.colors.datepicker.dateSelectedBg};
	flex-shrink: 0;
`;

export const Chip = styled.button<{ $selected: boolean }>`
	display: inline-flex;
	align-items: center;
	padding: 0.2rem 0.6rem;
	border-radius: 999px;
	border: 1px solid
		${({ theme, $selected }) =>
			$selected
				? theme.colors.datepicker.dateSelectedBg
				: theme.colors.datepicker.dateSelectedBg + '55'};
	background: ${({ theme, $selected }) =>
		$selected ? theme.colors.datepicker.dateSelectedBg : 'transparent'};
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
				: theme.colors.datepicker.dateSelectedBg + '22'};
		border-color: ${({ theme }) => theme.colors.datepicker.dateSelectedBg};
		color: ${({ theme, $selected }) =>
			$selected ? theme.colors.datepicker.dateSelectedText : theme.colors.text.primary};
	}
`;

const LocationChip = styled(Chip)`
	gap: 0.3rem;

	svg {
		flex-shrink: 0;
		color: ${({ theme, $selected }) =>
			$selected
				? theme.colors.datepicker.dateSelectedText
				: theme.colors.datepicker.dateSelectedBg};
	}
`;

const sweep = keyframes`
	0%   { transform: translateX(-100%); }
	100% { transform: translateX(400%); }
`;

const BarTrack = styled.div`
	height: 2px;
	border-radius: 999px;
	background: ${({ theme }) => theme.colors.border.default};
	overflow: hidden;
	margin-top: 0.375rem;
`;

const BarFill = styled.div`
	width: 25%;
	height: 100%;
	border-radius: 999px;
	background: ${({ theme }) => theme.colors.datepicker.dateSelectedBg};
	animation: ${sweep} 1.4s ease-in-out infinite;
`;

export const SuggestionsLoadingBar: React.FC = () => (
	<BarTrack>
		<BarFill />
	</BarTrack>
);
