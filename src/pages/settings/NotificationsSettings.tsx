import React, { useState } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import palette from '@/core/theme/palette';
import Button from '@/core/common/components/button';

const NotificationsSettings: React.FC = () => {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const [tileReminders, setTileReminders] = useState(true);
	const [emailNotifications, setEmailNotifications] = useState(true);
	const [isSaving, setIsSaving] = useState(false);

	const handleSaveChanges = async () => {
		setIsSaving(true);
		try {
			// TODO: Implement save functionality with backend
			await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate API call
			toast.success(t('settings.sections.notificationPreferences.saveSuccess'));
		} catch (error) {
			toast.error(t('settings.sections.notificationPreferences.saveError'));
			console.error('Failed to save changes:', error);
		} finally {
			setIsSaving(false);
		}
	};

	return (
		<Container>
			<Breadcrumb>
				<BreadcrumbLink onClick={() => navigate('/')}>
					{t('settings.breadcrumb.home')}
				</BreadcrumbLink>
				<BreadcrumbSeparator>/</BreadcrumbSeparator>
				<BreadcrumbLink onClick={() => navigate('/settings')}>
					{t('settings.breadcrumb.settings')}
				</BreadcrumbLink>
				<BreadcrumbSeparator>/</BreadcrumbSeparator>
				<BreadcrumbCurrent>{t('settings.sections.notificationPreferences.title')}</BreadcrumbCurrent>
			</Breadcrumb>

			<Header>
				<Title>{t('settings.sections.notificationPreferences.title')}</Title>
				<Description>{t('settings.sections.notificationPreferences.description')}</Description>
			</Header>

			<SettingsList>
				<SettingItem>
					<SettingLabel>{t('settings.sections.notificationPreferences.tileReminders')}</SettingLabel>
					<ToggleSwitch
						$checked={tileReminders}
						onClick={() => setTileReminders(!tileReminders)}
					>
						<ToggleSlider $checked={tileReminders} />
					</ToggleSwitch>
				</SettingItem>

				<SettingItem>
					<SettingLabel>{t('settings.sections.notificationPreferences.emailNotifications')}</SettingLabel>
					<ToggleSwitch
						$checked={emailNotifications}
						onClick={() => setEmailNotifications(!emailNotifications)}
					>
						<ToggleSlider $checked={emailNotifications} />
					</ToggleSwitch>
				</SettingItem>
			</SettingsList>

			<SaveButtonContainer>
				<Button variant="brand" onClick={handleSaveChanges} disabled={isSaving}>
					{isSaving
						? t('settings.sections.notificationPreferences.saving')
						: t('settings.sections.notificationPreferences.saveChanges')}
				</Button>
			</SaveButtonContainer>
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

const Header = styled.div`
	margin-bottom: 2rem;
`;

const Title = styled.h1`
	font-size: ${palette.typography.fontSize.displaySm};
	color: ${palette.colors.white};
	font-family: ${palette.typography.fontFamily.urban};
	font-weight: ${palette.typography.fontWeight.bold};
	margin: 0 0 0.5rem 0;
`;

const Description = styled.p`
	font-size: ${palette.typography.fontSize.sm};
	color: ${palette.colors.gray[500]};
	margin: 0;
`;

const SettingsList = styled.div`
	display: flex;
	flex-direction: column;
	gap: 1.5rem;
	margin-bottom: 2rem;
`;

const SettingItem = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 1.5rem 0;
	border-bottom: 1px solid ${palette.colors.gray[900]};

	&:last-child {
		border-bottom: none;
	}
`;

const SettingLabel = styled.label`
	font-size: ${palette.typography.fontSize.base};
	color: ${palette.colors.white};
	font-weight: ${palette.typography.fontWeight.medium};
	cursor: pointer;
`;

const ToggleSwitch = styled.div<{ $checked: boolean }>`
	position: relative;
	width: 48px;
	height: 28px;
	background-color: ${(props) =>
		props.$checked ? palette.colors.brand[500] : palette.colors.gray[700]};
	border-radius: 14px;
	cursor: pointer;
	transition: background-color 0.2s ease;

	&:hover {
		background-color: ${(props) =>
			props.$checked ? palette.colors.brand[600] : palette.colors.gray[600]};
	}
`;

const ToggleSlider = styled.div<{ $checked: boolean }>`
	position: absolute;
	top: 2px;
	left: ${(props) => (props.$checked ? '22px' : '2px')};
	width: 24px;
	height: 24px;
	background-color: ${palette.colors.white};
	border-radius: 50%;
	transition: left 0.2s ease;
`;

const SaveButtonContainer = styled.div`
	display: flex;
	justify-content: flex-end;
`;

export default NotificationsSettings;
