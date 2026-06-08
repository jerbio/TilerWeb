import React from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import TileShareClusterCard from '@/components/tileshare/TileShareClusterCard';
import TileShareClusterCardSkeleton from '@/components/tileshare/TileShareClusterCardSkeleton';
import Pagination from '@/core/common/components/Pagination';
import EmptyState from '@/core/common/components/EmptyState';
import { SendHorizonal } from 'lucide-react';
import useServerPagination from '@/hooks/useServerPagination';
import { tileshareService } from '@/services';

const TileshareSent: React.FC = () => {
	const { t } = useTranslation();

	const {
		items: clusters,
		page,
		setPage,
		pageSize,
		setPageSize,
		hasNext,
		loading,
	} = useServerPagination(
		({ page, pageSize }) => tileshareService.getOutboxClusters({ page, pageSize }),
		20
	);

	return (
		<Container>
			{!loading && clusters.length === 0 ? (
				<EmptyState icon={SendHorizonal} text={t('tilesharedemo.sent.empty')} />
			) : (
				<>
					<List>
						{loading
							? Array.from({ length: pageSize }, (_, i) => (
									<TileShareClusterCardSkeleton key={i} />
								))
							: clusters.map((cluster) => (
									<TileShareClusterCard key={cluster.id} cluster={cluster} />
								))}
					</List>
					<Pagination
						mode="simple"
						page={page}
						onChange={setPage}
						hasNext={hasNext}
						pageSize={pageSize}
						onPageSizeChange={setPageSize}
						disabled={loading}
					/>
				</>
			)}
		</Container>
	);
};

const Container = styled.div`
	display: flex;
	flex-direction: column;
	gap: 1rem;
	align-items: flex-start;
`;

const List = styled.div`
	display: flex;
	flex-direction: column;
	gap: 0.75rem;
	width: 100%;
`;

export default TileshareSent;
