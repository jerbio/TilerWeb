import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import useAppStore from '@/global_state';
import { useAuth } from '@/core/auth/useAuth';
import { useUiStore, notificationId, NotificationAction } from '@/core/ui';
import { useClusterDetail } from '@/hooks/useClusterDetail';
import { computeClusterProgress } from '@/core/util/tileshareProgress';
import { isTileshareOwner } from '@/core/util/tileshareOwnership';
import { tileshareService } from '@/services';
import { Routes } from '@/core/constants/routes';
import TileshareDetailBreadcrumb from '@/components/tileshare/detail/TileshareDetailBreadcrumb';
import MultiTileshareHeader from '@/components/tileshare/detail/MultiTileshareHeader';
import SingleTileshareHeader from '@/components/tileshare/detail/SingleTileshareHeader';
import DetailHeaderSkeleton from '@/components/tileshare/detail/DetailHeaderSkeleton';
import TiletteBody from '@/components/tileshare/detail/body/TiletteBody';
import EditTileshareModal, {
	type EditTileshareValues,
} from '@/components/tileshare/detail/EditTileshareModal';
import DeleteClusterDialog from '@/components/tileshare/detail/DeleteClusterDialog';
import TiletteCreate from '@/components/tileshare/TiletteCreate';

const TileshareDetailPage: React.FC = () => {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const { id } = useParams<{ id: string }>();
	const { data, loading, error, refresh } = useClusterDetail(id ?? null);
	const { user } = useAuth();
	const getActivePersonaSession = useAppStore((s) => s.getActivePersonaSession);
	const showNotification = useUiStore((s) => s.notification.show);
	const updateNotification = useUiStore((s) => s.notification.update);

	const [editing, setEditing] = useState(false);
	const [saving, setSaving] = useState(false);
	const [confirmingDelete, setConfirmingDelete] = useState(false);
	const [deleting, setDeleting] = useState(false);
	const [adding, setAdding] = useState(false);

	const cluster = data?.cluster;
	// Assignees get the same pages read-only: no edit, delete or add affordances.
	const isOwner = isTileshareOwner(cluster?.creator, user);

	const handleSave = async (values: EditTileshareValues) => {
		if (!cluster?.id) return;
		setSaving(true);
		const nId = notificationId(NotificationAction.Update, `tileshare-cluster-${cluster.id}`);
		showNotification(nId, t('tilesharedemo.detail.edit.saving'), 'loading');
		try {
			await tileshareService.updateCluster({
				Id: cluster.id,
				Name: values.name,
				Notes: values.description,
				// This route overwrites rather than merges: an omitted StartTime is
				// stored as DateTimeOffset.MinValue. Both bounds go every time, and a
				// cluster with no stored start falls back to its deadline.
				StartTime: cluster.start ?? values.dueDate,
				EndTime: values.dueDate,
			});
			await refresh();
			setEditing(false);
			updateNotification(nId, t('tilesharedemo.detail.edit.success'), 'success');
		} catch (err) {
			console.error('Error updating tileshare cluster', err);
			updateNotification(nId, t('tilesharedemo.detail.edit.error'), 'error');
		} finally {
			setSaving(false);
		}
	};

	const handleDelete = async () => {
		if (!cluster?.id) return;
		setDeleting(true);
		const nId = notificationId(NotificationAction.Delete, `tileshare-cluster-${cluster.id}`);
		showNotification(nId, t('tilesharedemo.detail.delete.deleting'), 'loading');
		try {
			const userInfo = getActivePersonaSession()?.userInfo;
			await tileshareService.deleteCluster({
				ClusterId: cluster.id,
				MobileApp: false,
				SocketId: null,
				TimeZoneOffset: userInfo?.timeZoneDifference ?? 0,
				Version: 'v2',
				TimeZone: userInfo?.timeZone ?? Intl.DateTimeFormat().resolvedOptions().timeZone,
				IsTimeZoneAdjusted: 'true',
				getTimeSpan: null,
				UserName: userInfo?.username ?? null,
				UserID: userInfo?.id ?? null,
			});
			updateNotification(nId, t('tilesharedemo.detail.delete.success'), 'success');
			setConfirmingDelete(false);
			navigate(Routes.Tileshare.root);
		} catch (err) {
			console.error('Error deleting tileshare cluster', err);
			updateNotification(nId, t('tilesharedemo.detail.delete.error'), 'error');
			setDeleting(false);
		}
	};

	// The add form takes over the whole page, like the tileshare create flow.
	if (adding && cluster?.id) {
		return (
			<TiletteCreate
				clusterId={cluster.id}
				clusterName={cluster.name ?? ''}
				onBack={() => setAdding(false)}
				onCreated={async () => {
					// Creating flips the cluster to multi and recomputes its user
					// list server-side, so take the fresh copy rather than patching.
					await refresh();
					setAdding(false);
				}}
			/>
		);
	}

	return (
		<Container>
			<TileshareDetailBreadcrumb current={cluster?.name ?? ''} loading={loading} />
			{loading ? (
				<DetailHeaderSkeleton />
			) : error || !cluster ? (
				<ErrorText>{t('tilesharedemo.detail.loadError')}</ErrorText>
			) : (
				<>
					{cluster.isMultiTilette ? (
						<>
							<MultiTileshareHeader
								name={cluster.name}
								description={cluster.notes}
								progress={computeClusterProgress(data?.tilettes ?? null)}
								date={cluster.end}
								onEdit={isOwner ? () => setEditing(true) : undefined}
								onAdd={isOwner ? () => setAdding(true) : undefined}
								onDelete={isOwner ? () => setConfirmingDelete(true) : undefined}
							/>
							<TiletteBody
								clusterId={cluster.id ?? ''}
								tilettes={data?.tilettes ?? []}
							/>
						</>
					) : (
						<SingleTileshareHeader
							name={cluster.name}
							description={cluster.notes}
							dueDate={cluster.end}
							onEdit={isOwner ? () => setEditing(true) : undefined}
							onDelete={isOwner ? () => setConfirmingDelete(true) : undefined}
						/>
					)}

					<EditTileshareModal
						show={editing}
						setShow={setEditing}
						headerText={t('tilesharedemo.detail.edit.clusterTitle')}
						initial={{
							name: cluster.name,
							description: cluster.notes,
							dueDate: cluster.end,
						}}
						saving={saving}
						onSubmit={handleSave}
					/>
					<DeleteClusterDialog
						show={confirmingDelete}
						setShow={setConfirmingDelete}
						name={cluster.name ?? ''}
						deleting={deleting}
						onConfirm={handleDelete}
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

	/* Keep the breadcrumb + header at their natural size; let the page scroll
	   instead of the flex column squeezing them when a view is tall. */
	& > * {
		flex-shrink: 0;
	}
`;

const ErrorText = styled.p`
	color: ${({ theme }) => theme.colors.text.secondary};
	font-size: ${({ theme }) => theme.typography.fontSize.base};
`;

export default TileshareDetailPage;
