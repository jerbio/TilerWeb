import React from 'react';
import styled from 'styled-components';
import { useParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import useAuthNavigate from '@/hooks/useNavigateHome';
import { Routes } from '@/core/constants/routes';

/**
 * Integration detail page (location editor and calendar selection draft).
 *
 * Phase 1: protected route shell that survives direct navigation and browser
 * refresh. Phase 4 fills in the location editor, Phase 5 the calendar
 * selection draft and Save.
 */
const ConnectionsDetailSettings: React.FC = () => {
	const { t } = useTranslation();
	const navigate = useAuthNavigate();
	const { integrationId } = useParams();

	// Development-only route diagnostic. Loading the route is not treated as a
	// connection attempt (see the plan's logging rules).
	if (import.meta.env.DEV && (!integrationId || integrationId.length > 128)) {
		console.warn(
			'[connections] detail route loaded without a valid integration id',
			integrationId ? `id length=${integrationId.length}` : 'id missing'
		);
	}

	return (
		<Container>
			<Breadcrumb>
				<BreadcrumbLink onClick={() => navigate(Routes.Settings)}>
					{t('settings.breadcrumb.settings')}
				</BreadcrumbLink>
				<BreadcrumbSeparator>/</BreadcrumbSeparator>
				<BreadcrumbLink onClick={() => navigate(Routes.SettingsConnections)}>
					{t('settings.sections.connections.title')}
				</BreadcrumbLink>
				<BreadcrumbSeparator>/</BreadcrumbSeparator>
				<BreadcrumbCurrent>{t('settings.sections.connections.title')}</BreadcrumbCurrent>
			</Breadcrumb>

			<Header>
				<Title>{t('settings.sections.connections.title')}</Title>
				<Description>{t('settings.sections.connections.description')}</Description>
			</Header>

			<Placeholder>{t('settings.sections.connections.placeholder')}</Placeholder>
		</Container>
	);
};

const Container = styled.div`
	max-width: 800px;
	margin: 0 auto;
`;

const Breadcrumb = styled.div`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	margin-bottom: 2rem;
	font-size: ${({ theme }) => theme.typography.fontSize.sm};
`;

const BreadcrumbLink = styled.span`
	color: ${({ theme }) => theme.colors.text.secondary};
	cursor: pointer;
	transition: color 0.2s ease;

	&:hover {
		color: ${({ theme }) => theme.colors.gray[400]};
	}
`;

const BreadcrumbSeparator = styled.span`
	color: ${({ theme }) => theme.colors.gray[600]};
`;

const BreadcrumbCurrent = styled.span`
	color: ${({ theme }) => theme.colors.text.primary};
`;

const Header = styled.div`
	margin-bottom: 2rem;
`;

const Title = styled.h1`
	font-size: ${({ theme }) => theme.typography.fontSize.displaySm};
	color: ${({ theme }) => theme.colors.text.primary};
	font-family: ${({ theme }) => theme.typography.fontFamily.urban};
	font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
	margin: 0 0 0.5rem 0;
`;

const Description = styled.p`
	font-size: ${({ theme }) => theme.typography.fontSize.sm};
	color: ${({ theme }) => theme.colors.text.secondary};
	margin: 0;
`;

const Placeholder = styled.p`
	font-size: ${({ theme }) => theme.typography.fontSize.sm};
	color: ${({ theme }) => theme.colors.text.secondary};
	margin: 0;
`;

export default ConnectionsDetailSettings;
