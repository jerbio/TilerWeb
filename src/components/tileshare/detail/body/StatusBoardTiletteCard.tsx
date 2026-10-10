import TiletteRsvpStatus from '@/components/tileshare/TiletteRsvpStatus';
import TiletteInvitationActions from '@/components/tileshare/TiletteInvitationActions';
import ShimmerOverlay from '@/components/tileshare/ShimmerOverlay';
import React, { useState } from 'react';
import styled, { css, keyframes } from 'styled-components';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { TileShareTemplate } from '@/core/common/types/tileshare';
import { useTheme } from '@/core/theme/ThemeProvider';
import { Routes } from '@/core/constants/routes';
import { getTileletteColor } from '@/core/util/tileletteColor';
import { filledSurface } from '@/core/util/colorSurface';
import { designatedToAvatars } from '@/core/util/tileshareAssignees';
import { canAcceptByDrag } from '@/core/util/tileshareProgress';
import { useAuth } from '@/core/auth/useAuth';
import { setBoardDragData } from './StatusBoardDrag';
import AvatarCluster from '@/core/common/components/AvatarCluster';
import TiletteWorkProgress from '@/components/tileshare/TiletteWorkProgress';

type StatusBoardTiletteCardProps = {
	tilette: TileShareTemplate;
	clusterId: string;
	/** When true (and the viewer can respond to this tilette) the card is a drag source. */
	draggable?: boolean;
	/** When true the viewer's accept request is in flight (shimmer + "Accepting…" badge). */
	accepting?: boolean;
	/** When true the card was just accepted and plays a one-shot settle-in. */
	justAccepted?: boolean;
};

/** A colour-filled tilette card in a status board column, linking to the tilette detail page. */
const StatusBoardTiletteCard: React.FC<StatusBoardTiletteCardProps> = ({
	tilette,
	clusterId,
	draggable,
	accepting,
	justAccepted,
}) => {
	const { t } = useTranslation();
	const { isDarkMode } = useTheme();
	const { user } = useAuth();
	const surface = filledSurface(getTileletteColor(tilette.id), isDarkMode);
	// Shimmer the whole card while an RSVP response is saving in place.
	const [saving, setSaving] = useState(false);
	// Only the viewer's own open invitation (None/Tentative, Todo lane) can be
	// accepted by dragging the card onto the In progress lane.
	const canDrag = !!draggable && !!user?.id && !!tilette.id && canAcceptByDrag(tilette, user.id);

	return (
		<Card
			$bg={surface.background}
			$border={surface.border}
			$justAccepted={justAccepted}
			data-board-card-id={tilette.id || undefined}
			data-just-accepted={justAccepted || undefined}
			aria-busy={saving || accepting || undefined}
			draggable={canDrag}
			onDragStart={
				canDrag
					? (e: React.DragEvent) => {
							setBoardDragData(e, tilette.id ?? '');
						}
					: undefined
			}
		>
			{/* draggable={false}: an <a href> is natively draggable and would start its own
			// URL drag when the pointer starts on the name, bypassing the card's drag
			// payload (and showing a no-drop cursor over the lanes). Disabling it makes
			// the browser walk up to the Card as the drag source. */}
			<CardLink
				to={Routes.Tileshare.tilette(clusterId, tilette.id ?? '')}
				draggable={false}
				aria-label={t('tilesharedemo.detail.openTiletteAria')}
			>
				<Name $color={surface.text}>{tilette.name ?? 'â€”'}</Name>
				<Footer>
					<TiletteWorkProgress tilette={tilette} />
					<AvatarCluster users={designatedToAvatars(tilette.designatedUsers)} size={24} />
				</Footer>
			</CardLink>
			<RsvpRow>
				<TiletteRsvpStatus tilette={tilette} embedded />
				<TiletteInvitationActions
					tilette={tilette}
					clusterId={clusterId}
					embedded
					reportBusy={setSaving}
				/>
				{saving && <ShimmerOverlay data-testid="tilette-shimmer" />}
			</RsvpRow>
			{accepting && (
				<>
					<ShimmerOverlay data-testid="board-accepting-shimmer" />
					<AcceptingBadge $dark={isDarkMode} data-testid="board-accepting" role="status">
						{t('tilesharedemo.detail.board.accepting')}
					</AcceptingBadge>
				</>
			)}
		</Card>
	);
};

/** The card fades in while the lane grows room for it (the column's LandingRow). */
const settleIn = keyframes`
	from {
		opacity: 0.35;
	}
	to {
		opacity: 1;
	}
`;

/** The badge fades up while the accept request is being processed. */
const badgeIn = keyframes`
	from {
		opacity: 0;
		transform: translateY(2px);
	}
	to {
		opacity: 1;
		transform: none;
	}
`;

/** Transient "Accepting…" pill shown on the card while the request is in flight. */
const AcceptingBadge = styled.span<{ $dark: boolean }>`
	position: absolute;
	top: 8px;
	right: 8px;
	z-index: 2;
	padding: 2px 10px;
	border-radius: 999px;
	font-size: ${({ theme }) => theme.typography.fontSize.xs};
	font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
	color: ${({ $dark, theme }) => ($dark ? theme.colors.brand[200] : theme.colors.brand[800])};
	background: ${({ $dark, theme }) =>
		$dark ? theme.colors.brand[900] : theme.colors.brand[100]};
	opacity: 0.92;
	animation: ${badgeIn} 150ms ease both;

	@media (prefers-reduced-motion: reduce) {
		animation: none;
	}
`;

const Card = styled.div<{ $bg: string; $border: string; $justAccepted?: boolean }>`
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

	${({ $justAccepted }) =>
		$justAccepted &&
		css`
			animation: ${settleIn} 300ms ease both;

			@media (prefers-reduced-motion: reduce) {
				animation: none;
			}
		`}
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

export default StatusBoardTiletteCard;
