import React from 'react';
import { useParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import { useClusterDetail } from '@/hooks/useClusterDetail';
import { computeClusterProgress } from '@/core/util/tileshareProgress';
import TileshareDetailBreadcrumb from '@/components/tileshare/detail/TileshareDetailBreadcrumb';
import MultiTileshareHeader from '@/components/tileshare/detail/MultiTileshareHeader';
import SingleTileshareHeader from '@/components/tileshare/detail/SingleTileshareHeader';
import DetailHeaderSkeleton from '@/components/tileshare/detail/DetailHeaderSkeleton';

const TileshareDetailPage: React.FC = () => {
	const { t } = useTranslation();
	const { id } = useParams<{ id: string }>();
	const { data, loading, error } = useClusterDetail(id ?? null);

	const cluster = data?.cluster;

	return (
		<Container>
			<TileshareDetailBreadcrumb current={cluster?.name ?? ''} />
			{loading ? (
				<DetailHeaderSkeleton />
			) : error || !cluster ? (
				<ErrorText>{t('tilesharedemo.detail.loadError')}</ErrorText>
			) : cluster.isMultiTilette ? (
				<MultiTileshareHeader
					name={cluster.name}
					description={cluster.notes}
					progress={computeClusterProgress(data?.tilettes ?? null)}
					date={cluster.end}
					onEdit={() => {}}
					onAdd={() => {}}
				/>
			) : (
				<SingleTileshareHeader
					name={cluster.name}
					description={cluster.notes}
					dueDate={cluster.end}
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

export default TileshareDetailPage;
