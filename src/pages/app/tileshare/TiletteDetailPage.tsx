import React from 'react';
import { useParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import { useTiletteDetail } from '@/hooks/useTiletteDetail';
import { useClusterHeader } from '@/hooks/useClusterHeader';
import { Routes } from '@/core/constants/routes';
import TileshareDetailBreadcrumb from '@/components/tileshare/detail/TileshareDetailBreadcrumb';
import SingleTileshareHeader from '@/components/tileshare/detail/SingleTileshareHeader';
import DetailHeaderSkeleton from '@/components/tileshare/detail/DetailHeaderSkeleton';

const TiletteDetailPage: React.FC = () => {
	const { t } = useTranslation();
	const { id: clusterId, tiletteId } = useParams<{ id: string; tiletteId: string }>();
	const { data: tilette, loading, error } = useTiletteDetail(tiletteId ?? null);
	// The tilette lives under a multi cluster (this route's :id) — resolve the
	// parent's name for the breadcrumb and the "In: {cluster}" header subtitle.
	const { data: cluster, loading: clusterLoading } = useClusterHeader(clusterId ?? null);

	const parentName = cluster?.name ?? '';
	const parent = clusterId
		? { label: parentName, href: Routes.Tileshare.detail(clusterId) }
		: undefined;

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
				<SingleTileshareHeader
					name={tilette.name}
					description={tilette.miscData?.userNote ?? null}
					dueDate={tilette.end}
					subtitle={t('tilesharedemo.detail.inCluster', { name: parentName })}
					onEdit={() => {}}
				/>
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
`;

const ErrorText = styled.p`
	color: ${({ theme }) => theme.colors.text.secondary};
	font-size: ${({ theme }) => theme.typography.fontSize.base};
`;

export default TiletteDetailPage;
