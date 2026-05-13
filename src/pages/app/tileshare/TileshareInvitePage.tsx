import React from 'react';
import { useTranslation } from 'react-i18next';

const TileshareInvitePage: React.FC = () => {
	const { t } = useTranslation();

	return <div>{t('tilesharedemo.invite.title')}</div>;
};

export default TileshareInvitePage;
