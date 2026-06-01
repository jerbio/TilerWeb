import React from 'react';
import styled, { useTheme } from 'styled-components';
import { Outlet, useLocation } from 'react-router';
import { ChevronRight } from 'lucide-react';
import Logo from '@/core/common/components/icons/logo';
import useAuthNavigate from '@/hooks/useNavigateHome';

const adminSections = [
	{
		title: 'Feature Flags',
		description: 'Toggle features on or off globally',
		path: '/admin/feature-flags',
	},
];

const AdminLayout: React.FC = () => {
	const navigate = useAuthNavigate();
	const location = useLocation();
	const theme = useTheme();

	const isDetailPage = location.pathname !== '/admin';

	return (
		<Container>
			<Header>
				<Logo size={48} />
				<AdminBadge>Admin</AdminBadge>
			</Header>

			{!isDetailPage ? (
				<Content>
					<Breadcrumb>
						<BreadcrumbLink onClick={() => navigate('/timeline')}>App</BreadcrumbLink>
						<BreadcrumbSeparator>/</BreadcrumbSeparator>
						<BreadcrumbCurrent>Admin</BreadcrumbCurrent>
					</Breadcrumb>

					<Title>Admin</Title>

					<SectionList>
						{adminSections.map((section) => (
							<SectionItem key={section.path} onClick={() => navigate(section.path)}>
								<SectionItemContent>
									<SectionItemTitle>{section.title}</SectionItemTitle>
									<SectionItemDescription>
										{section.description}
									</SectionItemDescription>
								</SectionItemContent>
								<ChevronRight size={20} color={theme.colors.text.secondary} />
							</SectionItem>
						))}
					</SectionList>
				</Content>
			) : (
				<Outlet />
			)}
		</Container>
	);
};

const Container = styled.div`
	min-height: 100vh;
	background-color: ${({ theme }) => theme.colors.background.page};
	padding: 2rem;
`;

const Header = styled.header`
	display: flex;
	align-items: center;
	gap: 1rem;
	margin-bottom: 2rem;
`;

const AdminBadge = styled.span`
	font-size: ${({ theme }) => theme.typography.fontSize.xs};
	font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
	color: ${({ theme }) => theme.colors.brand[400]};
	border: 1px solid ${({ theme }) => theme.colors.brand[400]};
	border-radius: 4px;
	padding: 2px 8px;
	letter-spacing: 0.05em;
	text-transform: uppercase;
`;

const Content = styled.div`
	max-width: 600px;
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

const Title = styled.h1`
	font-size: ${({ theme }) => theme.typography.fontSize.displaySm};
	color: ${({ theme }) => theme.colors.text.primary};
	font-family: ${({ theme }) => theme.typography.fontFamily.urban};
	font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
	margin: 0 0 3rem 0;
`;

const SectionList = styled.div`
	display: flex;
	flex-direction: column;
	gap: 1rem;
`;

const SectionItem = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 1.5rem 0;
	border-bottom: 1px solid ${({ theme }) => theme.colors.border.subtle};
	cursor: pointer;
	transition: all 0.2s ease;
	&:hover {
		padding-left: 0.5rem;
	}
	&:last-child {
		border-bottom: none;
	}
`;

const SectionItemContent = styled.div`
	flex: 1;
`;

const SectionItemTitle = styled.h3`
	font-size: ${({ theme }) => theme.typography.fontSize.lg};
	color: ${({ theme }) => theme.colors.text.primary};
	font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
	margin: 0 0 0.25rem 0;
`;

const SectionItemDescription = styled.p`
	font-size: ${({ theme }) => theme.typography.fontSize.sm};
	color: ${({ theme }) => theme.colors.text.secondary};
	margin: 0;
	line-height: 1.4;
`;

export default AdminLayout;
