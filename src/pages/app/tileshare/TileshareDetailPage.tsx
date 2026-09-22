import React from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router';
import TileShareDetailLayout from '@/components/tileshare/TileShareDetailLayout';

const TileshareDetailPage: React.FC = () => {
	const { t } = useTranslation();
	const { id } = useParams();

	return (
		<TileShareDetailLayout ClusterId={id}>
			{t('tilesharedemo.tileshareDetail.title')}
		</TileShareDetailLayout>
	);
};

export default TileshareDetailPage;
