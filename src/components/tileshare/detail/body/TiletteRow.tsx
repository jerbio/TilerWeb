import React from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { ArrowRight, Layers } from 'lucide-react';
import { useTheme } from '@/core/theme/ThemeProvider';
import { Routes } from '@/core/constants/routes';
import { TileShareTemplate } from '@/core/common/types/tileshare';
import { getTileletteColor } from '@/core/util/tileletteColor';
import { iconSurface } from '@/core/util/colorSurface';
import { deriveTileletteStatus } from '@/core/util/tileshareProgress';
import { designatedToAvatars } from '@/core/util/tileshareAssignees';
import AvatarCluster from '@/core/common/components/AvatarCluster';
import TiletteStatus from './TiletteStatus';

type TiletteRowProps = {
	tilette: TileShareTemplate;
	clusterId: string;
};

/** One tilette in the list view: coloured icon + name + arrow, then status + assignees. */
const TiletteRow: React.FC<TiletteRowProps> = ({ tilette, clusterId }) => {
	const { t } = useTranslation();
	const { isDarkMode } = useTheme();
	const surface = iconSurface(getTileletteColor(tilette.id), isDarkMode);

	return (
		<Card $darkmode={isDarkMode}>
			<TopRow>
				<IconBox $bg={surface.background} $fg={surface.foreground}>
					<Layers size={18} />
				</IconBox>
				<Name>{tilette.name ?? '—'}</Name>
				<ArrowLink
					to={Routes.Tileshare.tilette(clusterId, tilette.id ?? '')}
					aria-label={t('tilesharedemo.detail.openTiletteAria')}
				>
					<ArrowRight size={18} />
				</ArrowLink>
			</TopRow>
			<Divider />
			<BottomRow>
				<StatusGroup>
					<StatusLabel>{t('tilesharedemo.detail.statusLabel')}</StatusLabel>
					<TiletteStatus status={deriveTileletteStatus(tilette)} />
				</StatusGroup>
				<AvatarCluster users={designatedToAvatars(tilette.designatedUsers)} size={28} />
			</BottomRow>
		</Card>
	);
};

const Card = styled.div<{ $darkmode: boolean }>`
	border: 1px solid ${({ theme }) => theme.colors.border.default};
	border-radius: ${({ theme }) => theme.borderRadius.xLarge};
	overflow: hidden;
	background-color: ${({ $darkmode, theme }) =>
		$darkmode ? 'transparent' : theme.colors.background.card};
`;

const TopRow = styled.div`
	display: flex;
	align-items: center;
	gap: 0.875rem;
	padding: 1rem 1.25rem;
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

const Name = styled.p`
	flex: 1;
	min-width: 0;
	margin: 0;
	font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
	font-family: ${({ theme }) => theme.typography.fontFamily.urban};
	color: ${({ theme }) => theme.colors.text.primary};
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
`;

const ArrowLink = styled(Link)`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 40px;
	height: 40px;
	border-radius: ${({ theme }) => theme.borderRadius.medium};
	border: 1px solid ${({ theme }) => theme.colors.border.default};
	color: ${({ theme }) => theme.colors.brand[400]};
	flex-shrink: 0;
	transition: background-color 0.15s ease;

	&:hover {
		background-color: ${({ theme }) => theme.colors.background.card2};
	}
`;

const Divider = styled.hr`
	border: none;
	border-top: 1px solid ${({ theme }) => theme.colors.border.default};
	margin: 0;
`;

const BottomRow = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 1rem;
	padding: 1rem 1.25rem;
`;

const StatusGroup = styled.div`
	display: flex;
	align-items: center;
	gap: 0.5rem;
`;

const StatusLabel = styled.span`
	font-size: ${({ theme }) => theme.typography.fontSize.sm};
	color: ${({ theme }) => theme.colors.text.secondary};
`;

export default TiletteRow;
