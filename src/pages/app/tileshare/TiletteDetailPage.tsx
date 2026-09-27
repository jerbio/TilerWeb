import TiletteRsvpStatus, {
	TileShareViewerContext,
} from '@/components/tileshare/TiletteRsvpStatus';
import TiletteInvitationActions, {
	TiletteInvitationRefreshContext,
} from '@/components/tileshare/TiletteInvitationActions';
import React, { useState } from 'react';
import { useParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import TileShareDetailLayout from '@/components/tileshare/TileShareDetailLayout';
import { useAuth } from '@/core/auth/useAuth';
import { useUiStore, notificationId, NotificationAction } from '@/core/ui';
import { useTiletteDetail } from '@/hooks/useTiletteDetail';
import { useClusterHeader } from '@/hooks/useClusterHeader';
import { isTileshareOwner } from '@/core/util/tileshareOwnership';
import { tileshareService } from '@/services';
import { Routes } from '@/core/constants/routes';
import TileshareDetailBreadcrumb from '@/components/tileshare/detail/TileshareDetailBreadcrumb';
import SingleTileshareHeader from '@/components/tileshare/detail/SingleTileshareHeader';
import DetailHeaderSkeleton from '@/components/tileshare/detail/DetailHeaderSkeleton';
import EditTileshareModal, {
	type EditTileshareValues,
} from '@/components/tileshare/detail/EditTileshareModal';
import ShimmerOverlay from '@/components/tileshare/ShimmerOverlay';

const TiletteDetailPage: React.FC = () => {
	const { t } = useTranslation();
	const { id: clusterId, tiletteId } = useParams<{ id: string; tiletteId: string }>();
	const { data: tilette, loading, error, refresh } = useTiletteDetail(tiletteId ?? null);
	const { user } = useAuth();
	const showNotification = useUiStore((s) => s.notification.show);
	const updateNotification = useUiStore((s) => s.notification.update);
	const [editing, setEditing] = useState(false);
	const [saving, setSaving] = useState(false);
	// Shimmer the detail section while an RSVP response is saving in place.
	const [rsvpSaving, setRsvpSaving] = useState(false);
	// The tilette lives under a multi cluster (this route's :id) — resolve the
	// parent's name for the breadcrumb and the "In: {cluster}" header subtitle.
	const { data: cluster, loading: clusterLoading } = useClusterHeader(clusterId ?? null);

	// A tilette is editable by whoever owns the cluster it belongs to, not by the
	// assignee working on it.
	const isOwner = isTileshareOwner(cluster?.creator, user);
	const parentName = cluster?.name ?? '';
	const parent = clusterId
		? { label: parentName, href: Routes.Tileshare.detail(clusterId) }
		: undefined;

	const handleSave = async (values: EditTileshareValues) => {
		if (!tilette?.id) return;
		setSaving(true);
		const nId = notificationId(NotificationAction.Update, `tilette-${tilette.id}`);
		showNotification(nId, t('tilesharedemo.detail.edit.saving'), 'loading');
		try {
			await tileshareService.updateTilette({
				Id: tilette.id,
				Name: values.name,
				NoteMiscData: values.description,
				// The server keeps whichever bound is omitted, so the unchanged
				// start is sent alongside the edited due date.
				StartTime: tilette.start ?? undefined,
				EndTime: values.dueDate,
			});
			window.dispatchEvent(new Event('tileshare-changed'));
			await refresh();
			setEditing(false);
			updateNotification(nId, t('tilesharedemo.detail.edit.success'), 'success');
		} catch (err) {
			console.error('Error updating tilette', err);
			updateNotification(nId, t('tilesharedemo.detail.edit.error'), 'error');
		} finally {
			setSaving(false);
		}
	};

	return (
		<TileShareViewerContext.Provider value={{ isOwner, viewerId: user?.id ?? null }}>
			<TiletteInvitationRefreshContext.Provider value={refresh}>
				<TileShareDetailLayout
					ClusterId={tiletteId ? clusterId : undefined}
					TiletteId={tiletteId}
				>
					<Container>
						<TileshareDetailBreadcrumb
							current={tilette?.name ?? ''}
							parent={parent}
							loading={loading || clusterLoading}
						/>
						{loading ? (
							<DetailHeaderSkeleton />
						) : error || !tilette ? (
							<ErrorText>{t('tilesharedemo.detail.loadError')}</ErrorText>
						) : (
							<>
								<Detail>
									<SingleTileshareHeader
										name={tilette.name}
										description={tilette.miscData?.userNote ?? null}
										dueDate={tilette.end}
										subtitle={t('tilesharedemo.detail.inCluster', {
											name: parentName,
										})}
										onEdit={isOwner ? () => setEditing(true) : undefined}
									/>
									<RsvpRow>
										<TiletteRsvpStatus tilette={tilette} embedded />
										<TiletteInvitationActions
											tilette={tilette}
											clusterId={clusterId ?? ''}
											embedded
											reportBusy={setRsvpSaving}
										/>
										{rsvpSaving && (
											<ShimmerOverlay data-testid="tilette-shimmer" />
										)}
									</RsvpRow>
								</Detail>
								<EditTileshareModal
									show={editing}
									setShow={setEditing}
									headerText={t('tilesharedemo.detail.edit.tiletteTitle')}
									initial={{
										name: tilette.name,
										description: tilette.miscData?.userNote ?? null,
										dueDate: tilette.end,
									}}
									saving={saving}
									onSubmit={handleSave}
								/>
							</>
						)}
					</Container>
				</TileShareDetailLayout>
			</TiletteInvitationRefreshContext.Provider>
		</TileShareViewerContext.Provider>
	);
};

const Container = styled.div`
	display: flex;
	flex-direction: column;
	gap: 1.5rem;
	width: 100%;
	height: 100%;
	overflow-y: auto;
	background-color: ${({ theme }) => theme.colors.background.page};

	& > * {
		flex-shrink: 0;
	}
`;

/** Header + response section as one relative surface so the saving shimmer can cover it. */
const Detail = styled.div`
	position: relative;
	display: flex;
	flex-direction: column;
	gap: 1.5rem;
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

const ErrorText = styled.p`
	color: ${({ theme }) => theme.colors.text.secondary};
	font-size: ${({ theme }) => theme.typography.fontSize.base};
`;

export default TiletteDetailPage;
