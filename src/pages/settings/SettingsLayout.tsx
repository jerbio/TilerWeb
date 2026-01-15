import React from 'react';
import styled from 'styled-components';
import { Outlet, useNavigate, useLocation } from 'react-router';
import { ChevronRight, LogOut } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import palette from '@/core/theme/palette';
import Logo from '@/core/common/components/icons/logo';
import useAppStore from '@/global_state';
import { toast } from 'sonner'

const SettingsLayout: React.FC = () => {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const location = useLocation();
	const logout = useAppStore((state) => state.logout);

	const settingsSections = [
		{
			title: t('settings.sections.accountInfo.title'),
			description: t('settings.sections.accountInfo.description'),
			path: '/settings/account',
		},
		// TODO: Uncomment when ready
		// {
		// 	title: t('settings.sections.tilePreferences.title'),
		// 	description: t('settings.sections.tilePreferences.description'),
		// 	path: '/settings/preferences',
		// },
		// {
		// 	title: t('settings.sections.tilerContacts.title'),
		// 	description: t('settings.sections.tilerContacts.description'),
		// 	path: '/settings/contacts',
		// },
		// {
		// 	title: t('settings.sections.notificationPreferences.title'),
		// 	description: t('settings.sections.notificationPreferences.description'),
		// 	path: '/settings/notifications',
		// },
		// {
		// 	title: t('settings.sections.connections.title'),
		// 	description: t('settings.sections.connections.description'),
		// 	path: '/settings/connections',
		// },
	];

	const handleLogout = async () => {
	try {
      await logout();
      toast.success(t('timeline.userMenu.signOutSuccess'));
      navigate('/signin');
    } catch (error) {
      toast.error(t('timeline.userMenu.signOutError'));
      console.error('Logout failed:', error);
    }
	};

	// Check if we're on a settings detail page
	const isDetailPage = location.pathname !== '/settings';

	return (
		<Container>
			<Header>
				<Logo size={48} />
			</Header>

			{!isDetailPage ? (
				<Content>
					<Breadcrumb>
						<BreadcrumbLink onClick={() => navigate('/')}>
							{t('settings.breadcrumb.home')}
						</BreadcrumbLink>
						<BreadcrumbSeparator>/</BreadcrumbSeparator>
						<BreadcrumbCurrent>{t('settings.breadcrumb.settings')}</BreadcrumbCurrent>
					</Breadcrumb>

					<Title>{t('settings.title')}</Title>

					<SettingsList>
						{settingsSections.map((section) => (
							<SettingsItem key={section.path} onClick={() => navigate(section.path)}>
								<SettingsItemContent>
									<SettingsItemTitle>{section.title}</SettingsItemTitle>
									<SettingsItemDescription>{section.description}</SettingsItemDescription>
								</SettingsItemContent>
								<ChevronRight size={20} color={palette.colors.gray[500]} />
							</SettingsItem>
						))}
					</SettingsList>

					<LogoutButton onClick={handleLogout}>
						<LogOut size={16} />
						{t('settings.logout')}
					</LogoutButton>
				</Content>
			) : (
				<Outlet />
			)}
		</Container>
	);
};

const Container = styled.div`
	min-height: 100vh;
	background-color: ${palette.colors.black};
	padding: 2rem;
`;

const Header = styled.header`
	display: flex;
	align-items: center;
	margin-bottom: 2rem;
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
	font-size: ${palette.typography.fontSize.sm};
`;

const BreadcrumbLink = styled.span`
	color: ${palette.colors.gray[500]};
	cursor: pointer;
	transition: color 0.2s ease;

	&:hover {
		color: ${palette.colors.gray[400]};
	}
`;

const BreadcrumbSeparator = styled.span`
	color: ${palette.colors.gray[600]};
`;

const BreadcrumbCurrent = styled.span`
	color: ${palette.colors.white};
`;

const Title = styled.h1`
	font-size: ${palette.typography.fontSize.displaySm};
	color: ${palette.colors.white};
	font-family: ${palette.typography.fontFamily.urban};
	font-weight: ${palette.typography.fontWeight.bold};
	margin: 0 0 3rem 0;
`;

const SettingsList = styled.div`
	display: flex;
	flex-direction: column;
	gap: 1rem;
	margin-bottom: 3rem;
`;

const SettingsItem = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 1.5rem 0;
	border-bottom: 1px solid ${palette.colors.gray[900]};
	cursor: pointer;
	transition: all 0.2s ease;

	&:hover {
		padding-left: 0.5rem;
	}

	&:last-child {
		border-bottom: none;
	}
`;

const SettingsItemContent = styled.div`
	flex: 1;
`;

const SettingsItemTitle = styled.h3`
	font-size: ${palette.typography.fontSize.lg};
	color: ${palette.colors.white};
	font-weight: ${palette.typography.fontWeight.medium};
	margin: 0 0 0.25rem 0;
`;

const SettingsItemDescription = styled.p`
	font-size: ${palette.typography.fontSize.sm};
	color: ${palette.colors.gray[500]};
	margin: 0;
	line-height: 1.4;
`;

const LogoutButton = styled.button`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	background: transparent;
	border: none;
	color: ${palette.colors.brand[400]};
	font-size: ${palette.typography.fontSize.base};
	font-weight: ${palette.typography.fontWeight.medium};
	cursor: pointer;
	padding: 0;
	transition: color 0.2s ease;

	&:hover {
		color: ${palette.colors.brand[300]};
	}
`;

export default SettingsLayout;
