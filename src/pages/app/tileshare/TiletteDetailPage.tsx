import React from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router';
import TileShareDetailLayout from '@/components/tileshare/TileShareDetailLayout';

const TiletteDetailPage: React.FC = () => {
	const { t } = useTranslation();
	const { id, tiletteId } = useParams();

	return (
		<TileShareDetailLayout ClusterId={tiletteId ? id : undefined} TiletteId={tiletteId}>
			{t('tilesharedemo.tiletteDetail.title')}
		</TileShareDetailLayout>
	);
};

export default TiletteDetailPage;
