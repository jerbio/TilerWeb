import TiletteRsvpStatus from '@/components/tileshare/TiletteRsvpStatus';
import TiletteInvitationActions from '@/components/tileshare/TiletteInvitationActions';
import ShimmerOverlay from '@/components/tileshare/ShimmerOverlay';
import React, { useState } from 'react';
import styled from 'styled-components';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { TileShareTemplate } from '@/core/common/types/tileshare';
import { useTheme } from '@/core/theme/ThemeProvider';
import { Routes } from '@/core/constants/routes';
import { getTileletteColor } from '@/core/util/tileletteColor';
import { filledSurface } from '@/core/util/colorSurface';
import { designatedToAvatars } from '@/core/util/tileshareAssignees';
import AvatarCluster from '@/core/common/components/AvatarCluster';
import TiletteWorkProgress from '@/components/tileshare/TiletteWorkProgress';

type AssigneeTiletteCardProps = {
	tilette: TileShareTemplate;
	clusterId: string;
	assigneeId: string;
};

/** A colour-filled tilette card inside an assignee column, linking to the tilette detail page. */
const AssigneeTiletteCard: React.FC<AssigneeTiletteCardProps> = ({
	tilette,
	clusterId,
	assigneeId,
}) => {
	const { t } = useTranslation();
	const { isDarkMode } = useTheme();
	const surface = filledSurface(getTileletteColor(tilette.id), isDarkMode);
	// Shimmer the whole card while an RSVP response is saving in place.
	const [saving, setSaving] = useState(false);

	return (
		<Card $bg={surface.background} $border={surface.border} aria-busy={saving || undefined}>
			<CardLink
				to={Routes.Tileshare.tilette(clusterId, tilette.id ?? '')}
				aria-label={t('tilesharedemo.detail.openTiletteAria')}
			>
				<Name $color={surface.text}>{tilette.name ?? '—'}</Name>
				<Footer>
					<TiletteWorkProgress tilette={tilette} assigneeId={assigneeId} />
					<AvatarCluster users={designatedToAvatars(tilette.designatedUsers)} size={24} />
				</Footer>
			</CardLink>
			<RsvpRow>
				<TiletteRsvpStatus tilette={tilette} assigneeId={assigneeId} embedded />
				<TiletteInvitationActions
					tilette={tilette}
					clusterId={clusterId}
					assigneeId={assigneeId}
					embedded
					reportBusy={setSaving}
				/>
				{saving && <ShimmerOverlay data-testid="tilette-shimmer" />}
			</RsvpRow>
		</Card>
	);
};

const Card = styled.div<{ $bg: string; $border: string }>`
	position: relative;
	display: flex;
	flex-direction: column;
	border-radius: ${({ theme }) => theme.borderRadius.large};
	background-color: ${({ $bg }) => $bg};
	border: 1px solid ${({ $border }) => $border};
	text-decoration: none;
	transition: filter 0.15s ease;

	&:hover {
		filter: brightness(1.08);
	}
`;

const CardLink = styled(Link)`
	display: flex;
	flex-direction: column;
	gap: 1.5rem;
	padding: 0.875rem;
	color: inherit;
	text-decoration: none;
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

/** One bordered row hosting the RSVP badge and the inline response actions. */
const RsvpRow = styled.div`
	display: flex;
	align-items: center;
	flex-wrap: wrap;
	gap: 12px;
	padding: 12px 20px;
	border-top: 1px solid ${({ theme }) => theme.colors.border.default};
	&:empty {
		display: none;
	}
`;

export default AssigneeTiletteCard;
