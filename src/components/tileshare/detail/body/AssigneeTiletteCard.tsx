import React from 'react';
import styled from 'styled-components';
import { TileShareTemplate } from '@/core/common/types/tileshare';
import { useTheme } from '@/core/theme/ThemeProvider';
import { getTileletteColor } from '@/core/util/tileletteColor';
import { filledSurface } from '@/core/util/colorSurface';
import { deriveTileletteStatus } from '@/core/util/tileshareProgress';
import { designatedToAvatars } from '@/core/util/tileshareAssignees';
import AvatarCluster from '@/core/common/components/AvatarCluster';
import TiletteStatus from './TiletteStatus';

type AssigneeTiletteCardProps = {
	tilette: TileShareTemplate;
};

/** A colour-filled tilette card inside an assignee column: name, status icon, assignees. */
const AssigneeTiletteCard: React.FC<AssigneeTiletteCardProps> = ({ tilette }) => {
	const { isDarkMode } = useTheme();
	const surface = filledSurface(getTileletteColor(tilette.id), isDarkMode);

	return (
		<Card $bg={surface.background} $border={surface.border}>
			<Name $color={surface.text}>{tilette.name ?? '—'}</Name>
			<Footer>
				<TiletteStatus status={deriveTileletteStatus(tilette)} showLabel={false} />
				<AvatarCluster users={designatedToAvatars(tilette.designatedUsers)} size={24} />
			</Footer>
		</Card>
	);
};

const Card = styled.div<{ $bg: string; $border: string }>`
	display: flex;
	flex-direction: column;
	gap: 1.5rem;
	padding: 0.875rem;
	border-radius: ${({ theme }) => theme.borderRadius.large};
	background-color: ${({ $bg }) => $bg};
	border: 1px solid ${({ $border }) => $border};
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
