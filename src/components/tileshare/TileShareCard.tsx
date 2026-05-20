import React from 'react';
import styled, { useTheme } from 'styled-components';
import { useTranslation } from 'react-i18next';
import { ArrowRight, CalendarDays, Clock, Layers, Link2, MessageSquare } from 'lucide-react';
import dayjs from 'dayjs';
import { unixToTimeString } from '@/core/util/eventTimeConversion';
import ProgressBar from '@/core/common/components/ProgressBar';
import AvatarCluster, { type AvatarUser } from '@/core/common/components/AvatarCluster';
import Button from '@/core/common/components/button';

export type { AvatarUser };

export type TileShareCardProps = {
	title: string | null;
	subtitle?: string | null;
	progress: number | null;
	due: number | null;
	avatarUsers: AvatarUser[];
	commentCount?: number | null;
	linkCount?: number | null;
};

const TileShareCard: React.FC<TileShareCardProps> = ({
	title,
	subtitle,
	progress,
	due,
	avatarUsers,
	commentCount,
	linkCount,
}) => {
	const theme = useTheme();
	const { t } = useTranslation();

	const formattedDueOn = due ? dayjs(due).format('ddd, D MMM, YYYY') : '—';
	const formattedDueBy = due ? unixToTimeString(due) : '—';

	return (
		<CardGrid>
			<LeftTop>
				<IconBox>
					<Layers size={18} />
				</IconBox>
				<TitleBlock>
					<Title>{title ?? '—'}</Title>
					{subtitle && <Subtitle>{subtitle}</Subtitle>}
				</TitleBlock>
				<Button
					height={40}
					style={{
						color: theme.colors.brand[300],
						border: `1px solid ${theme.colors.border.default}`,
					}}
					variant={'ghost'}
					size="small"
					aria-label="View"
				>
					<ArrowRight size={20} />
				</Button>
			</LeftTop>

			<RightTop>
				<DueWrapper>
					<DueItem>
						<DueIcon>
							<CalendarDays size={16} />
						</DueIcon>
						<DueContent>
							<DueLabel>{t('tilesharedemo.card.dueOn')}</DueLabel>
							<DueValue>{formattedDueOn}</DueValue>
						</DueContent>
					</DueItem>
					<DueDivider />
					<DueItem>
						<DueIcon>
							<Clock size={16} />
						</DueIcon>
						<DueContent>
							<DueLabel>{t('tilesharedemo.card.dueBy')}</DueLabel>
							<DueValue>{formattedDueBy}</DueValue>
						</DueContent>
					</DueItem>
				</DueWrapper>
			</RightTop>

			<LeftBottom>
				<ProgressBar label={t('tilesharedemo.card.progress')} percentage={progress ?? 0} />
			</LeftBottom>

			<RightBottom>
				<AvatarCluster users={avatarUsers} />
				<MetaGroup>
					<MetaItem>
						<MessageSquare size={16} />
						{commentCount != null && <MetaCount>{commentCount}</MetaCount>}
					</MetaItem>
					<MetaItem>
						<Link2 size={16} />
						{linkCount != null && <MetaCount>{linkCount}</MetaCount>}
					</MetaItem>
				</MetaGroup>
			</RightBottom>
		</CardGrid>
	);
};

const CardGrid = styled.div`
	display: grid;
	grid-template-columns: 7fr 1px 5fr;
	grid-template-rows: auto 1px auto;
	background-color: ${({ theme }) => theme.colors.border.default};
	border: 1px solid ${({ theme }) => theme.colors.border.default};
	border-radius: ${({ theme }) => theme.borderRadius.xLarge};
	overflow: hidden;

	@media (max-width: 640px) {
		grid-template-columns: 1fr;
		grid-template-rows: auto 1px auto 1px auto 1px auto;
	}
`;

const cellBase = `
	background-color: var(--cell-bg);
	padding: 1rem 1.25rem;
`;

const LeftTop = styled.div`
	${cellBase}
	background-color: ${({ theme }) => theme.colors.background.card};
	grid-column: 1;
	grid-row: 1;
	display: flex;
	align-items: center;
	gap: 0.75rem;

	@media (max-width: 640px) {
		grid-column: 1;
		grid-row: 1;
	}
`;

const RightTop = styled.div`
	${cellBase}
	background-color: ${({ theme }) => theme.colors.background.card};
	grid-column: 3;
	grid-row: 1;
	display: flex;
	align-items: center;

	@media (max-width: 640px) {
		grid-column: 1;
		grid-row: 3;
	}
`;

const LeftBottom = styled.div`
	${cellBase}
	background-color: ${({ theme }) => theme.colors.background.card};
	grid-column: 1;
	grid-row: 3;
	display: flex;
	align-items: center;

	@media (max-width: 640px) {
		grid-column: 1;
		grid-row: 5;
	}
`;

const RightBottom = styled.div`
	${cellBase}
	background-color: ${({ theme }) => theme.colors.background.card};
	grid-column: 3;
	grid-row: 3;
	display: flex;
	align-items: center;
	justify-content: space-between;

	@media (max-width: 640px) {
		grid-column: 1;
		grid-row: 7;
	}
`;

const IconBox = styled.div`
	width: 40px;
	height: 40px;
	border-radius: ${({ theme }) => theme.borderRadius.medium};
	background-color: ${({ theme }) => theme.colors.orange[800]};
	display: flex;
	align-items: center;
	justify-content: center;
	color: ${({ theme }) => theme.colors.white};
	flex-shrink: 0;
`;

const TitleBlock = styled.div`
	flex: 1;
	min-width: 0;
`;

const Title = styled.p`
	margin: 0;
	font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
	font-family: ${({ theme }) => theme.typography.fontFamily.urban};
	color: ${({ theme }) => theme.colors.text.primary};
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
`;

const Subtitle = styled.p`
	margin: 0;
	font-size: ${({ theme }) => theme.typography.fontSize.sm};
	color: ${({ theme }) => theme.colors.text.secondary};
`;

const DUE_WRAPPER_PADDING = '0.75rem';

const DueWrapper = styled.div`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	padding: ${DUE_WRAPPER_PADDING};
	border: 1px solid ${({ theme }) => theme.colors.border.default};
	border-radius: ${({ theme }) => theme.borderRadius.large};
	width: 100%;
`;

const DueDivider = styled.div`
	width: 1px;
	align-self: stretch;
	background-color: ${({ theme }) => theme.colors.border.default};
	flex-shrink: 0;
`;

const DueItem = styled.div`
	display: flex;
	align-items: flex-start;
	gap: 0.5rem;
	flex: 1;
`;

const DueIcon = styled.div`
	color: ${({ theme }) => theme.colors.text.secondary};
	margin-top: 2px;
	flex-shrink: 0;
	font-family: ${({ theme }) => theme.typography.fontFamily.urban};
`;

const DueContent = styled.div`
	display: flex;
	flex-direction: column;
	gap: 2px;
`;

const DueLabel = styled.span`
	font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
	font-size: ${({ theme }) => theme.typography.fontSize.sm};
	font-family: ${({ theme }) => theme.typography.fontFamily.urban};
	color: ${({ theme }) => theme.colors.text.secondary};
	white-space: nowrap;
`;

const DueValue = styled.span`
	font-size: ${({ theme }) => theme.typography.fontSize.sm};
	font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
	font-family: ${({ theme }) => theme.typography.fontFamily.urban};
	color: ${({ theme }) => theme.colors.text.primary};
	white-space: nowrap;
`;

const MetaGroup = styled.div`
	display: flex;
	align-items: center;
	gap: 1rem;
`;

const MetaItem = styled.div`
	display: flex;
	align-items: center;
	gap: 0.375rem;
	color: ${({ theme }) => theme.colors.text.secondary};
`;

const MetaCount = styled.span`
	font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
	font-size: ${({ theme }) => theme.typography.fontSize.sm};
	color: ${({ theme }) => theme.colors.text.primary};
`;

export default TileShareCard;
