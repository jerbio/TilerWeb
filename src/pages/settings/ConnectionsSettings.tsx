import React from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import useAuthNavigate from '@/hooks/useNavigateHome';
import { Routes } from '@/core/constants/routes';

/**
 * Connections list page.
 *
 * Phase 1: protected route shell (breadcrumb, header, placeholder).
 * Phase 3 fills in the provider rows, the Google connect flow, and the
 * connected integration summaries.
 */
const ConnectionsSettings: React.FC = () => {
	const { t } = useTranslation();
	const navigate = useAuthNavigate();

	return (
		<Container>
			<Breadcrumb>
				<BreadcrumbLink onClick={() => navigate(Routes.Settings)}>
					{t('settings.breadcrumb.settings')}
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

export default ConnectionsSettings;
