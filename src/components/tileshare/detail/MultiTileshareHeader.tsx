import React from 'react';
import styled, { useTheme } from 'styled-components';
import { useTranslation } from 'react-i18next';
import { CalendarDays, Pencil, Plus, Timer, Trash2 } from 'lucide-react';
import { MultiTileshareIcon } from '@/components/tileshare/icons';
import Button from '@/core/common/components/button';
import ProgressBar from '@/core/common/components/ProgressBar';
import { unixToTimeString } from '@/core/util/eventTimeConversion';
import { formatDetailDate } from '@/core/util/tileshareDate';
import DetailHeaderCard, { HeaderDivider, HeaderSection } from './DetailHeaderCard';
import { TILESHARE_ACCENT } from '@/components/tileshare/accents';
import { RGB } from '@/core/util/colors';

type MultiTileshareHeaderProps = {
	name: string | null;
	description: string | null;
	/** Whole-percentage cluster progress (0–100), computed by the caller. */
	progress: number;
	/** Epoch used for the displayed date and time. */
	date: number | null;
	/** Icon accent colour. Defaults to the shared tileshare accent. */
	accent?: RGB;
	onEdit?: () => void;
	onAdd?: () => void;
	/** Omitted for viewers who can't delete — the button is hidden, not disabled. */
	onDelete?: () => void;
};

const MultiTileshareHeader: React.FC<MultiTileshareHeaderProps> = ({
	name,
	description,
	progress,
	date,
	accent = TILESHARE_ACCENT,
	onEdit,
	onAdd,
	onDelete,
}) => {
	const theme = useTheme();
	const { t } = useTranslation();
	const hasActions = !!onEdit || !!onDelete || !!onAdd;

	return (
		<DetailHeaderCard
			icon={<MultiTileshareIcon size={22} />}
			accent={accent}
			title={name ?? '—'}
			subtitle={t('tilesharedemo.detail.multiTileshare')}
			headerRight={
				/* Assignees get a read-only header — no actions at all. */
				hasActions ? (
					<>
						{onEdit && (
							<Button
								variant="ghost"
								size="small"
								height={40}
								onClick={onEdit}
								aria-label={t('tilesharedemo.detail.editAria')}
								style={{
									color: theme.colors.text.secondary,
									border: `1px solid ${theme.colors.border.default}`,
								}}
							>
								<Pencil size={18} />
							</Button>
						)}
						{onDelete && (
							<Button
								variant="ghost"
								size="small"
								height={40}
								onClick={onDelete}
								aria-label={t('tilesharedemo.detail.deleteAria')}
								style={{
									color: theme.colors.text.error,
									border: `1px solid ${theme.colors.border.default}`,
								}}
							>
								<Trash2 size={18} />
							</Button>
						)}
						{onAdd && (
							<Button
								variant="brand"
								size="small"
								height={40}
								onClick={onAdd}
								aria-label={t('tilesharedemo.detail.addAria')}
							>
								<Plus size={18} />
							</Button>
						)}
					</>
				) : undefined
			}
		>
			<HeaderSection>
				<Description>{description || t('tilesharedemo.detail.noDescription')}</Description>
			</HeaderSection>
			<HeaderDivider />
			<HeaderSection>
				<Footer>
					<FlexProgress
						percentage={progress}
						label={t('tilesharedemo.detail.progress')}
					/>
					<VDivider />
					<Chip>
						<CalendarDays size={16} />
						<ChipText>{formatDetailDate(date)}</ChipText>
					</Chip>
					<Chip>
						<Timer size={16} />
						<ChipText>{date ? unixToTimeString(date) : '—'}</ChipText>
					</Chip>
				</Footer>
			</HeaderSection>
		</DetailHeaderCard>
	);
};

const Description = styled.p`
	margin: 0;
	font-size: ${({ theme }) => theme.typography.fontSize.sm};
	color: ${({ theme }) => theme.colors.text.secondary};
	line-height: 1.5;
`;

const Footer = styled.div`
	display: flex;
	align-items: center;
	gap: 1rem;

	@media (max-width: 640px) {
		flex-direction: column;
		align-items: stretch;
	}
`;

const FlexProgress = styled(ProgressBar)`
	flex: 1;
	min-width: 0;
`;

const VDivider = styled.div`
	width: 1px;
	align-self: stretch;
	background-color: ${({ theme }) => theme.colors.border.default};
	flex-shrink: 0;

	@media (max-width: 640px) {
		display: none;
	}
`;

const Chip = styled.div`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	padding: 0.625rem 0.875rem;
	border: 1px solid ${({ theme }) => theme.colors.border.default};
	border-radius: ${({ theme }) => theme.borderRadius.large};
	color: ${({ theme }) => theme.colors.text.secondary};
	flex-shrink: 0;
`;

const ChipText = styled.span`
	font-size: ${({ theme }) => theme.typography.fontSize.sm};
	font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
	font-family: ${({ theme }) => theme.typography.fontFamily.urban};
	color: ${({ theme }) => theme.colors.text.primary};
	white-space: nowrap;
`;

export default MultiTileshareHeader;
