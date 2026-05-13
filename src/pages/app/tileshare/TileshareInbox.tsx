import React from 'react';
import { useTranslation } from 'react-i18next';

const TileshareInbox: React.FC = () => {
	const { t } = useTranslation();

	return <div>{t('tilesharedemo.inbox.title')}</div>;
};

export default TileshareInbox;
