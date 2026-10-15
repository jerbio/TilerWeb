import React from 'react';
import styled, { useTheme } from 'styled-components';
import { useTranslation } from 'react-i18next';
import { CalendarDays, Pencil, Plus, Timer, Trash2 } from 'lucide-react';
import { MultiTileshareIcon } from '@/components/tileshare/icons';
import Button from '@/core/common/components/button';
import { unixToTimeString } from '@/core/util/eventTimeConversion';
import { formatDetailDate } from '@/core/util/tileshareDate';
import DetailHeaderCard, { HeaderSection } from './DetailHeaderCard';
import { TILESHARE_ACCENT } from '@/components/tileshare/accents';
import { RGB } from '@/core/util/colors';
import TileShareNote from '../TileShareNote';

type MultiTileshareHeaderProps = {
	subtitle?: string;
	name: string | null;
	description: string | null;
	descriptionContent?: React.ReactNode;
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
	subtitle,
	name,
	description,
	descriptionContent,
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
			compact
			icon={<MultiTileshareIcon size={22} />}
			accent={accent}
			title={name ?? '—'}
			subtitle={subtitle ?? t('tilesharedemo.detail.multiTileshare')}
			headerRight={
				/* Assignees get a read-only header — no actions at all. */
				<>
					<Footer>
						<CalendarDays size={16} />
						<ChipText>{formatDetailDate(date)}</ChipText>
						<Timer size={14} />
						<ChipText>{date ? unixToTimeString(date) : '—'}</ChipText>
					</Footer>
					{hasActions && (
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
									{t('tileShareVisual.edit', 'Edit')}
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
									{t('tileShareComposer.newTilette', 'New tilette')}
								</Button>
							)}
						</>
					)}
				</>
			}
		>
			{(descriptionContent || description) && (
				<CompactSection>
					<Description>
						{descriptionContent ??
							(description ? (
								<TileShareNote content={description} />
							) : (
								t('tilesharedemo.detail.noDescription')
							))}
					</Description>
				</CompactSection>
			)}
		</DetailHeaderCard>
	);
};

const Description = styled.div`
	margin: 0;
	font-size: ${({ theme }) => theme.typography.fontSize.sm};
	color: ${({ theme }) => theme.colors.text.secondary};
	line-height: 1.5;
`;

const Footer = styled.div`
	display: flex;
	align-items: center;
	gap: 8px;
	flex-wrap: wrap;
	color: ${({ theme }) => theme.colors.text.secondary};
`;

const CompactSection = styled(HeaderSection)`
	padding: 8px 20px;
	@media (max-width: 600px) {
		padding: 8px 20px;
	}
`;

const ChipText = styled.span`
	font-size: ${({ theme }) => theme.typography.fontSize.sm};
	font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
	font-family: ${({ theme }) => theme.typography.fontFamily.urban};
	color: ${({ theme }) => theme.colors.text.primary};
	white-space: nowrap;
`;

export default MultiTileshareHeader;
