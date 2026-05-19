import React from 'react';
import { useTranslation } from 'react-i18next';
import { useOutletContext } from 'react-router';
import { TileshareDashboardOutletContext } from './TileShareDashboard';

const TileshareOutbox: React.FC = () => {
	const { t } = useTranslation();
	const { clusters } = useOutletContext<TileshareDashboardOutletContext>();

	console.log('tileshare outbox', clusters);

	return <div>{t('tilesharedemo.outbox.title')}</div>;
};

export default TileshareOutbox;
