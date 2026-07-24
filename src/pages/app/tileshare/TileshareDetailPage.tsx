import React from 'react';
import { useTranslation } from 'react-i18next';

const TileshareDetailPage: React.FC = () => {
	const { t } = useTranslation();

	return <div>{t('tilesharedemo.tileshareDetail.title')}</div>;
};

export default TileshareDetailPage;
