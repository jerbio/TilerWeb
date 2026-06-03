import React from 'react';
import styled, { useTheme } from 'styled-components';
import { useTranslation } from 'react-i18next';
import { ArrowRight, CalendarDays, Clock, Layers, Link2, MessageSquare } from 'lucide-react';
import dayjs from 'dayjs';
import { unixToTimeString } from '@/core/util/eventTimeConversion';
import AvatarCluster, { type AvatarUser } from '@/core/common/components/AvatarCluster';
import Button from '@/core/common/components/button';
import { TileShareCluster } from '@/core/common/types/tileshare';
import { Link } from 'react-router';
import ROUTES from '@/core/constants/routes';
import Tooltip from '@/core/common/components/tooltip';

type TileShareClusterCardProps = {
	cluster: TileShareCluster;
};

const TileShareClusterCard: React.FC<TileShareClusterCardProps> = ({ cluster }) => {
	const theme = useTheme();
	const { t } = useTranslation();

	const avatarUsers: AvatarUser[] = cluster.truncatedUser
		? cluster.truncatedUser
				.split(',')
				.map((email) => ({ name: email.trim(), email: email.trim() }))
		: [];

	const subtitle = cluster.isMultiTilette
		? t('tilesharedemo.card.multiTileshare')
		: t('tilesharedemo.card.tileshare');

	const formattedDueOn = cluster.end ? dayjs(cluster.end).format('ddd, D MMM, YYYY') : '—';
	const formattedDueBy = cluster.end ? unixToTimeString(cluster.end) : '—';

	return (
		<CardGrid>
			<Left>
				<IconBox>
					{cluster.isMultiTilette ? <Layers size={18} /> : <MessageSquare size={18} />}
				</IconBox>
				<TitleBlock>
					<Title>{cluster.name ?? '—'}</Title>
					<SubHeader>
						<Subtitle>{subtitle}</Subtitle>
						{cluster.creator && (
							<>
								<span>|</span>
								<Subtitle>
									{cluster.creator.username ?? cluster.creator.firstName}
								</Subtitle>
							</>
						)}
					</SubHeader>
				</TitleBlock>
				<Link to={ROUTES.tileshare.detail(cluster.id ?? '')}>
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
				</Link>
			</Left>

			<Right>
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

				<AvatarRow>
					<AvatarCluster
						users={avatarUsers}
						renderWrapper={(user, i, avatar) => (
							<Tooltip key={i} text={user.email ?? user.name ?? ''} position="top">
								{avatar}
							</Tooltip>
						)}
					/>
					<MetaGroup>
						<MetaItem>
							<MessageSquare size={16} />
						</MetaItem>
						<MetaItem>
							<Link2 size={16} />
							<MetaCount>{avatarUsers.length}</MetaCount>
						</MetaItem>
					</MetaGroup>
				</AvatarRow>
			</Right>
		</CardGrid>
	);
};

const CardGrid = styled.div`
	display: grid;
	grid-template-columns: 7fr 1px 5fr;
	grid-template-rows: auto;
	background-color: ${({ theme }) => theme.colors.border.default};
	border: 1px solid ${({ theme }) => theme.colors.border.default};
	border-radius: ${({ theme }) => theme.borderRadius.xLarge};
	overflow: hidden;

	@media (max-width: 640px) {
		grid-template-columns: 1fr;
		grid-template-rows: auto 1px auto;
	}
`;

const Left = styled.div`
	background-color: ${({ theme }) => theme.colors.background.card};
	padding: 1rem 1.25rem;
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

const Right = styled.div`
	background-color: ${({ theme }) => theme.colors.background.card};
	padding: 1rem 1.25rem;
	grid-column: 3;
	grid-row: 1;
	display: flex;
	flex-direction: column;
	justify-content: center;
	gap: 0.75rem;

	@media (max-width: 640px) {
		grid-column: 1;
		grid-row: 3;
	}
`;

const IconBox = styled.div`
	width: 40px;
	height: 40px;
	border-radius: ${({ theme }) => theme.borderRadius.medium};
	background-color: ${({ theme }) => theme.colors.brand[500]};
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

const SubHeader = styled.div`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	span {
		color: ${({ theme }) => theme.colors.text.muted};
	}
`;

const Subtitle = styled.p`
	font-size: ${({ theme }) => theme.typography.fontSize.sm};
	color: ${({ theme }) => theme.colors.text.secondary};
`;

const DueWrapper = styled.div`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	padding: 0.75rem;
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

const AvatarRow = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
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

export default TileShareClusterCard;
