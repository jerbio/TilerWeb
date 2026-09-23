import React from 'react';
import styled from 'styled-components';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { TileShareTemplate } from '@/core/common/types/tileshare';
import { useTheme } from '@/core/theme/ThemeProvider';
import { Routes } from '@/core/constants/routes';
import { getTileletteColor } from '@/core/util/tileletteColor';
import { filledSurface } from '@/core/util/colorSurface';
import { deriveTileletteStatus } from '@/core/util/tileshareProgress';
import { designatedToAvatars } from '@/core/util/tileshareAssignees';
import AvatarCluster from '@/core/common/components/AvatarCluster';
import TiletteStatus from './TiletteStatus';

type AssigneeTiletteCardProps = {
	tilette: TileShareTemplate;
	clusterId: string;
};

/** A colour-filled tilette card inside an assignee column, linking to the tilette detail page. */
const AssigneeTiletteCard: React.FC<AssigneeTiletteCardProps> = ({ tilette, clusterId }) => {
	const { t } = useTranslation();
	const { isDarkMode } = useTheme();
	const surface = filledSurface(getTileletteColor(tilette.id), isDarkMode);

	return (
		<Card
			to={Routes.Tileshare.tilette(clusterId, tilette.id ?? '')}
			aria-label={t('tilesharedemo.detail.openTiletteAria')}
			$bg={surface.background}
			$border={surface.border}
		>
			<Name $color={surface.text}>{tilette.name ?? '—'}</Name>
			<Footer>
				<TiletteStatus status={deriveTileletteStatus(tilette)} showLabel={false} />
				<AvatarCluster users={designatedToAvatars(tilette.designatedUsers)} size={24} />
			</Footer>
		</Card>
	);
};

const Card = styled(Link)<{ $bg: string; $border: string }>`
	display: flex;
	flex-direction: column;
	gap: 1.5rem;
	padding: 0.875rem;
	border-radius: ${({ theme }) => theme.borderRadius.large};
	background-color: ${({ $bg }) => $bg};
	border: 1px solid ${({ $border }) => $border};
	text-decoration: none;
	transition: filter 0.15s ease;

	&:hover {
		filter: brightness(1.08);
	}
`;

const Name = styled.p<{ $color: string }>`
	margin: 0;
	font-size: ${({ theme }) => theme.typography.fontSize.sm};
	font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
	font-family: ${({ theme }) => theme.typography.fontFamily.urban};
	color: ${({ $color }) => $color};
`;

const Footer = styled.div`
	display: flex;
	align-items: flex-end;
	justify-content: space-between;
	gap: 0.5rem;
`;

export default AssigneeTiletteCard;
