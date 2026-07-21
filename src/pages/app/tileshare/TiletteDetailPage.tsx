import React from 'react';
import { useParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import { useTiletteDetail } from '@/hooks/useTiletteDetail';
import TileshareDetailBreadcrumb from '@/components/tileshare/detail/TileshareDetailBreadcrumb';
import SingleTileshareHeader from '@/components/tileshare/detail/SingleTileshareHeader';
import DetailHeaderSkeleton from '@/components/tileshare/detail/DetailHeaderSkeleton';

const TiletteDetailPage: React.FC = () => {
	const { t } = useTranslation();
	const { tiletteId } = useParams<{ tiletteId: string }>();
	const { data: tilette, loading, error } = useTiletteDetail(tiletteId ?? null);

	return (
		<Container>
			<TileshareDetailBreadcrumb current={tilette?.name ?? ''} />
			{loading ? (
				<DetailHeaderSkeleton />
			) : error || !tilette ? (
				<ErrorText>{t('tilesharedemo.detail.loadError')}</ErrorText>
			) : (
				<SingleTileshareHeader
					name={tilette.name}
					description={tilette.miscData?.userNote ?? null}
					dueDate={tilette.end}
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
