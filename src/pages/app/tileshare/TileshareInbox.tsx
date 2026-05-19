import React from 'react';
import { useTranslation } from 'react-i18next';
import { useOutletContext } from 'react-router';
import { TileshareDashboardOutletContext } from './TileShareDashboard';

const TileshareInbox: React.FC = () => {
	const { t } = useTranslation();
	const { tiles } = useOutletContext<TileshareDashboardOutletContext>();

	console.log('tileshare inbox', tiles);

	return <div>{t('tilesharedemo.inbox.title')}</div>;
};

export default TileshareInbox;
