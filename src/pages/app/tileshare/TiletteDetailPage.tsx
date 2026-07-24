import React from 'react';
import { useTranslation } from 'react-i18next';

const TiletteDetailPage: React.FC = () => {
	const { t } = useTranslation();

	return <div>{t('tilesharedemo.tiletteDetail.title')}</div>;
};

export default TiletteDetailPage;
