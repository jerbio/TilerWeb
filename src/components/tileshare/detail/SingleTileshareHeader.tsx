import React from 'react';
import styled, { useTheme } from 'styled-components';
import { useTranslation } from 'react-i18next';
import { CalendarDays, Pencil, Trash2 } from 'lucide-react';
import { SingleTileshareIcon } from '@/components/tileshare/icons';
import Button from '@/core/common/components/button';
import { formatDetailDate } from '@/core/util/tileshareDate';
import DetailHeaderCard, { HeaderSection } from './DetailHeaderCard';
import { TILESHARE_ACCENT } from '@/components/tileshare/accents';
import { RGB } from '@/core/util/colors';

type SingleTileshareHeaderProps = {
	name: string | null;
	description: string | null;
	/** Epoch used for the displayed due date. */
	dueDate: number | null;
	/** Subtitle under the title. Defaults to "Single tileshare"; tilettes pass "In: {cluster}". */
	subtitle?: string;
	/** Icon accent colour. Defaults to the shared tileshare accent. */
	accent?: RGB;
	onEdit?: () => void;
	/** Omitted for viewers who can't delete — the button is hidden, not disabled. */
	onDelete?: () => void;
};

const SingleTileshareHeader: React.FC<SingleTileshareHeaderProps> = ({
	name,
	description,
	dueDate,
	subtitle,
	accent = TILESHARE_ACCENT,
	onEdit,
	onDelete,
}) => {
	const theme = useTheme();
	const { t } = useTranslation();
	const hasActions = !!onEdit || !!onDelete;

	return (
		<DetailHeaderCard
			icon={<SingleTileshareIcon size={22} />}
			accent={accent}
			title={name ?? '—'}
			subtitle={subtitle ?? t('tilesharedemo.detail.singleTileshare')}
			headerRight={
				<>
					<DuePill>
						<CalendarDays size={16} />
						<DueText>
							{t('tilesharedemo.detail.due', { date: formatDetailDate(dueDate) })}
						</DueText>
					</DuePill>
					{/* Assignees see the due pill alone — no divider, no actions. */}
					{hasActions && <VDivider />}
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
				</>
			}
		>
			<HeaderSection>
				<Description>{description || t('tilesharedemo.detail.noDescription')}</Description>
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

const DuePill = styled.div`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	padding: 0.625rem 0.875rem;
	border: 1px solid ${({ theme }) => theme.colors.border.default};
	border-radius: ${({ theme }) => theme.borderRadius.large};
	color: ${({ theme }) => theme.colors.text.secondary};
`;

const DueText = styled.span`
	font-size: ${({ theme }) => theme.typography.fontSize.sm};
	font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
	font-family: ${({ theme }) => theme.typography.fontFamily.urban};
	color: ${({ theme }) => theme.colors.text.primary};
	white-space: nowrap;
`;

const VDivider = styled.div`
	width: 1px;
	align-self: stretch;
	background-color: ${({ theme }) => theme.colors.border.default};
	flex-shrink: 0;
`;

export default SingleTileshareHeader;
