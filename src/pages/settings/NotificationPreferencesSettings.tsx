import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import Button from '@/core/common/components/button';
import Toggle from '@/core/common/components/Toggle';
import { userService } from '@/services';

const NotificationPreferencesSettings: React.FC = () => {
	const { t } = useTranslation();
	const navigate = useNavigate();

	const [tileReminders, setTileReminders] = useState(false);
	const [emailNotifications, setEmailNotifications] = useState(false);
	const [pushNotifications, setPushNotifications] = useState(false);
	const [originalValues, setOriginalValues] = useState({
		tileReminders: false,
		emailNotifications: false,
		pushNotifications: false,
	});
	const [isLoading, setIsLoading] = useState(true);
	const [isSaving, setIsSaving] = useState(false);

	useEffect(() => {
		const fetchSettings = async () => {
			try {
				const settings = await userService.getSettings();
				const { userPreference } = settings;
				const fetchedValues = {
					tileReminders: userPreference.tileNotificationEnabled,
					emailNotifications: userPreference.emailNotificationEnabled,
					pushNotifications: userPreference.pushNotificationEnabled,
				};
				setTileReminders(fetchedValues.tileReminders);
				setEmailNotifications(fetchedValues.emailNotifications);
				setPushNotifications(fetchedValues.pushNotifications);
				setOriginalValues(fetchedValues);
			} catch (error) {
				console.error('Failed to fetch settings:', error);
				toast.error(t('settings.sections.notificationPreferences.saveError'));
			} finally {
				setIsLoading(false);
			}
		};

		fetchSettings();
	}, [t]);

	const handleSaveChanges = async () => {
		// Build object with only changed fields
		const changedUserPreference: Record<string, boolean> = {};

		if (tileReminders !== originalValues.tileReminders) {
			changedUserPreference.TileNotificationEnabled = tileReminders;
		}
		if (emailNotifications !== originalValues.emailNotifications) {
			changedUserPreference.EmailNotificationEnabled = emailNotifications;
		}
		if (pushNotifications !== originalValues.pushNotifications) {
			changedUserPreference.PushNotificationEnabled = pushNotifications;
		}

		// If nothing changed, don't make API call
		if (Object.keys(changedUserPreference).length === 0) {
			toast.success(t('settings.sections.notificationPreferences.saveSuccess'));
			return;
		}

		setIsSaving(true);
		try {
			const settings = await userService.updateSettings({
				UserPreference: changedUserPreference,
			});
			// Update state with server response
			const { userPreference } = settings;
			const serverValues = {
				tileReminders: userPreference.tileNotificationEnabled,
				emailNotifications: userPreference.emailNotificationEnabled,
				pushNotifications: userPreference.pushNotificationEnabled,
			};
			setTileReminders(serverValues.tileReminders);
			setEmailNotifications(serverValues.emailNotifications);
			setPushNotifications(serverValues.pushNotifications);
			setOriginalValues(serverValues);
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

			<Section>
				<Toggle
					label={t('settings.sections.notificationPreferences.tileReminders')}
					isOn={tileReminders}
					onChange={setTileReminders}
					disabled={isLoading}
				/>
				<Toggle
					label={t('settings.sections.notificationPreferences.emailNotifications')}
					isOn={emailNotifications}
					onChange={setEmailNotifications}
					disabled={isLoading}
				/>
				<Toggle
					label={t('settings.sections.notificationPreferences.pushNotifications')}
					isOn={pushNotifications}
					onChange={setPushNotifications}
					disabled={isLoading}
				/>
			</Section>

			<SaveButtonContainer>
				<Button variant="brand" onClick={handleSaveChanges} disabled={isSaving || isLoading}>
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

const Section = styled.div`
	margin-bottom: 3rem;
`;

const SaveButtonContainer = styled.div`
	display: flex;
	justify-content: flex-end;
`;

export default NotificationPreferencesSettings;
