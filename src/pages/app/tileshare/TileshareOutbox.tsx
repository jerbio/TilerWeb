import React from 'react';
import { useTranslation } from 'react-i18next';

const TileshareOutbox: React.FC = () => {
	const { t } = useTranslation();

	return <div>{t('tilesharedemo.outbox.title')}</div>;
};

export default TileshareOutbox;
