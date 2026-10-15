import { useState } from 'react';
import styled from 'styled-components';
import { Link } from 'react-router';
import { ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { TileShareTemplate } from '@/core/common/types/tileshare';
import { Routes } from '@/core/constants/routes';
import { designatedToAvatars } from '@/core/util/tileshareAssignees';
import AvatarCluster from '@/core/common/components/AvatarCluster';
import TiletteWorkProgress from '../../TiletteWorkProgress';
import TiletteRsvpStatus from '../../TiletteRsvpStatus';
import TiletteInvitationActions from '../../TiletteInvitationActions';
import ShimmerOverlay from '../../ShimmerOverlay';

export default function TiletteRow({
	tilette,
	clusterId,
}: {
	tilette: TileShareTemplate;
	clusterId: string;
}) {
	const { t } = useTranslation();
	const [saving, setSaving] = useState(false);
	const route = Routes.Tileshare.tilette(clusterId, tilette.id ?? '');
	return (
		<Row role="listitem" aria-busy={saving || undefined}>
			<Name to={route} title={tilette.name ?? undefined}>
				{tilette.name ?? '—'}
			</Name>
			<Progress>
				<TiletteWorkProgress tilette={tilette} compact />
			</Progress>
			<People>
				<AvatarCluster
					users={designatedToAvatars(tilette.designatedUsers)}
					size={24}
					max={2}
				/>
			</People>
			<Response>
				<TiletteRsvpStatus tilette={tilette} embedded compact />
				<TiletteInvitationActions
					tilette={tilette}
					clusterId={clusterId}
					compact
					reportBusy={setSaving}
				/>
			</Response>
			<Arrow to={route} aria-label={t('tilesharedemo.detail.openTiletteAria')}>
				<ArrowRight size={16} />
			</Arrow>
			{saving && <ShimmerOverlay data-testid="tilette-shimmer" />}
		</Row>
	);
}

const Row = styled.div`
	position: relative;
	display: grid;
	align-items: center;
	grid-template-columns: minmax(0, 1fr) 64px 32px;
	gap: 8px 12px;
	padding: 12px 16px;
	min-height: 96px;
	@container (max-width:400px) {
		grid-template-columns: minmax(0, 1fr) auto;
		min-height: 88px;
	}
	border-bottom: 1px solid ${({ theme }) => theme.colors.border.default};
	&:last-child {
		border-bottom: 0;
		border-radius: 0 0 12px 12px;
	}
	&:hover {
		background: ${({ theme }) => theme.colors.background.card2};
	}
	@container (min-width:820px) {
		grid-template-columns: minmax(180px, 1fr) 138px 64px 216px 32px;
		min-height: 68px;
		gap: 12px;
	}
`;
const Name = styled(Link)`
	min-width: 0;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
	grid-column: 1;
	grid-row: 1;
	font-weight: 600;
	color: ${({ theme }) => theme.colors.text.primary};
	&:hover {
		text-decoration: underline;
	}
	@container (max-width:400px) {
		grid-column: 1 / 3;
		padding-right: 64px;
	}
`;
const Progress = styled.div`
	min-width: 0;
	grid-column: 1;
	grid-row: 2;
	@container (min-width:820px) {
		grid-column: 2;
		grid-row: 1;
	}
`;
const People = styled.div`
	grid-column: 2;
	grid-row: 1;
	justify-self: end;
	@container (max-width:400px) {
		grid-column: 2;
	}
	@container (min-width:820px) {
		grid-column: 3;
		justify-self: start;
	}
`;
const Response = styled.div`
	display: flex;
	align-items: center;
	justify-content: flex-end;
	gap: 8px;
	flex-wrap: wrap;
	min-width: 0;
	grid-column: 2 / 4;
	grid-row: 2;
	> details {
		max-width: 100%;
		margin-left: 0;
	}
	@container (min-width:820px) {
		grid-column: 4;
		grid-row: 1;
	}
	@container (max-width:400px) {
		grid-column: 2;
		grid-row: 2;
	}
`;
const Arrow = styled(Link)`
	grid-column: 3;
	grid-row: 1;
	display: grid;
	place-items: center;
	width: 32px;
	height: 32px;
	border-radius: 8px;
	color: ${({ theme }) => theme.colors.text.secondary};
	&:hover {
		color: ${({ theme }) => theme.colors.brand[400]};
	}
	@container (min-width:820px) {
		grid-column: 5;
	}
	@container (max-width:400px) {
		display: none;
	}
`;
