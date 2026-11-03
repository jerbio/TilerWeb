import React from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import { ArrowRight, CalendarDays } from 'lucide-react';
import TileShareModeIcon from './TileShareModeIcon';
import { TILESHARE_ACCENT } from '@/components/tileshare/accents';
import { useTheme as useAppTheme } from '@/core/theme/ThemeProvider';
import { iconSurface } from '@/core/util/colorSurface';
import dayjs from 'dayjs';
import { unixToTimeString } from '@/core/util/eventTimeConversion';
import AvatarCluster, { type AvatarUser } from '@/core/common/components/AvatarCluster';
import { TileShareCluster } from '@/core/common/types/tileshare';
import { tileshareMode } from '@/core/util/tileshareMode';
import { Link } from 'react-router';
import { Routes } from '@/core/constants/routes';
import Tooltip from '@/core/common/components/tooltip';

type TileShareClusterCardProps = {
	cluster: TileShareCluster;
	returnTo?: string;
};

const TileShareClusterCard: React.FC<TileShareClusterCardProps> = ({ cluster, returnTo }) => {
	const { isDarkMode } = useAppTheme();
	const { t } = useTranslation();
	const surface = iconSurface(TILESHARE_ACCENT, isDarkMode);

	const avatarUsers: AvatarUser[] = cluster.truncatedUser
		? cluster.truncatedUser
				.split(',')
				.map((email) => ({ name: email.trim(), email: email.trim() }))
		: [];

	const mode = tileshareMode(cluster);
	const subtitle = mode
		? t(`tileShareModes.${mode}.label`)
		: t('tileshareList.title', 'TileShares');

	const formattedDueOn = cluster.end ? dayjs(cluster.end).format('ddd, D MMM, YYYY') : '—';
	const formattedDueBy = cluster.end ? unixToTimeString(cluster.end) : '—';

	return (
		<CardGrid
			to={Routes.Tileshare.detail(cluster.id ?? '')}
			state={returnTo ? { tileShareListReturnTo: returnTo } : undefined}
		>
			<Left>
				<IconBox $bg={surface.background} $fg={surface.foreground}>
					<TileShareModeIcon mode={mode} size={22} />
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
			</Left>

			<Right>
				<Participants>
					{avatarUsers.length > 0 && (
						<AvatarCluster
							users={avatarUsers}
							size={28}
							renderWrapper={(user, i, avatar) => (
								<Tooltip
									key={i}
									text={user.email ?? user.name ?? ''}
									position="top"
								>
									{avatar}
								</Tooltip>
							)}
						/>
					)}
				</Participants>
				<DueItem>
					<DueIcon>
						<CalendarDays size={16} />
					</DueIcon>
					<DueContent>
						<DueSummary>
							<DueLabel>{t('tilesharedemo.card.due')}</DueLabel>
							<DueTime>{formattedDueBy}</DueTime>
						</DueSummary>
						<DueValue>{formattedDueOn}</DueValue>
					</DueContent>
				</DueItem>
			</Right>
			<OpenIndicator aria-hidden="true">
				<ArrowRight size={20} />
			</OpenIndicator>
		</CardGrid>
	);
};

const CardGrid = styled(Link)`
	display: grid;
	grid-template-columns: minmax(0, 1fr) auto 24px;
	align-items: center;
	gap: 20px;
	padding: 16px 20px;
	background-color: ${({ theme }) => theme.colors.background.card};
	border: 1px solid ${({ theme }) => theme.colors.border.default};
	border-radius: ${({ theme }) => theme.borderRadius.xLarge};
	text-decoration: none;
	color: inherit;
	box-shadow: 0 2px 6px rgba(0, 0, 0, 0.025);
	transition:
		background-color 160ms ease,
		border-color 160ms ease,
		box-shadow 160ms ease;
	&:hover {
		border-color: ${({ theme }) => theme.colors.input.borderHover};
		box-shadow: 0 6px 20px rgba(0, 0, 0, 0.07);
	}
	&:focus-visible {
		outline: 2px solid ${({ theme }) => theme.colors.brand[400]};
		outline-offset: 3px;
	}
	&:hover,
	&:focus-visible {
		background-color: ${({ theme }) =>
			theme.colors.interaction?.highlight ?? theme.colors.background.card};
	}
	@media (prefers-reduced-motion: reduce) {
		transition: none;
	}

	@media (max-width: 760px) {
		grid-template-columns: minmax(0, 1fr) 24px;
		gap: 12px;
		padding: 16px;
	}
`;

const Left = styled.div`
	grid-column: 1;
	grid-row: 1;
	display: flex;
	align-items: center;
	gap: 0.75rem;
	min-width: 0;
`;

const Right = styled.div`
	grid-column: 2;
	grid-row: 1;
	display: grid;
	grid-template-columns: 6.5rem 12rem;
	align-items: center;
	gap: 24px;

	@media (max-width: 760px) {
		grid-column: 1 / -1;
		grid-row: 2;
		grid-template-columns: 6.5rem minmax(0, 12rem);
		justify-content: space-between;
		gap: 12px;
	}
	@media (max-width: 360px) {
		grid-template-columns: minmax(0, 1fr);
	}
`;

const Participants = styled.div`
	display: flex;
	align-items: center;
	min-height: 28px;
`;

const OpenIndicator = styled.span`
	grid-column: 3;
	grid-row: 1;
	display: flex;
	align-items: center;
	justify-content: center;
	color: ${({ theme }) => theme.colors.brand[300]};
	@media (max-width: 760px) {
		grid-column: 2;
	}
`;

const IconBox = styled.div<{ $bg: string; $fg: string }>`
	width: 40px;
	height: 40px;
	border-radius: ${({ theme }) => theme.borderRadius.medium};
	background-color: ${({ $bg }) => $bg};
	color: ${({ $fg }) => $fg};
	display: flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
`;

const TitleBlock = styled.div`
	display: flex;
	flex-direction: column;
	gap: 4px;
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
	min-width: 0;
	span {
		color: ${({ theme }) => theme.colors.text.muted};
	}
`;

const Subtitle = styled.p`
	margin: 0;
	min-width: 0;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
	font-size: ${({ theme }) => theme.typography.fontSize.sm};
	color: ${({ theme }) => theme.colors.text.secondary};
`;

const DueItem = styled.div`
	display: flex;
	align-items: flex-start;
	gap: 0.5rem;
	min-width: 0;
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
	min-width: 0;
`;

const DueSummary = styled.div`
	display: flex;
	align-items: center;
	gap: 6px;
`;

const DueLabel = styled.span`
	font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
	font-size: ${({ theme }) => theme.typography.fontSize.sm};
	font-family: ${({ theme }) => theme.typography.fontFamily.urban};
	color: ${({ theme }) => theme.colors.text.secondary};
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
`;

const DueValue = styled.span`
	font-size: ${({ theme }) => theme.typography.fontSize.sm};
	font-weight: 550;
	font-family: ${({ theme }) => theme.typography.fontFamily.urban};
	color: ${({ theme }) => theme.colors.text.primary};
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
`;

const DueTime = styled(DueValue)`
	color: ${({ theme }) => theme.colors.text.secondary};
`;

export default TileShareClusterCard;
