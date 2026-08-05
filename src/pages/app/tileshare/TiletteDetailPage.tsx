import React, { useState } from 'react';
import { useParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
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

const TiletteDetailPage: React.FC = () => {
	const { t } = useTranslation();
	const { id: clusterId, tiletteId } = useParams<{ id: string; tiletteId: string }>();
	const { data: tilette, loading, error, refresh } = useTiletteDetail(tiletteId ?? null);
	const { user } = useAuth();
	const showNotification = useUiStore((s) => s.notification.show);
	const updateNotification = useUiStore((s) => s.notification.update);
	const [editing, setEditing] = useState(false);
	const [saving, setSaving] = useState(false);
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
					<SingleTileshareHeader
						name={tilette.name}
						description={tilette.miscData?.userNote ?? null}
						dueDate={tilette.end}
						subtitle={t('tilesharedemo.detail.inCluster', { name: parentName })}
						onEdit={isOwner ? () => setEditing(true) : undefined}
					/>
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
	padding: 1rem 1.5rem 1.5rem;

	& > * {
		flex-shrink: 0;
	}
`;

const ErrorText = styled.p`
	color: ${({ theme }) => theme.colors.text.secondary};
	font-size: ${({ theme }) => theme.typography.fontSize.base};
`;

export default TiletteDetailPage;
