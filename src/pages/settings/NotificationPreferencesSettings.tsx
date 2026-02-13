import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import palette from '@/core/theme/palette';
import Button from '@/core/common/components/button';
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
		const changedSettings: Record<string, boolean> = {};

		if (tileReminders !== originalValues.tileReminders) {
			changedSettings.tileNotificationEnabled = tileReminders;
		}
		if (emailNotifications !== originalValues.emailNotifications) {
			changedSettings.emailNotificationEnabled = emailNotifications;
		}
		if (pushNotifications !== originalValues.pushNotifications) {
			changedSettings.pushNotificationEnabled = pushNotifications;
		}

		// If nothing changed, don't make API call
		if (Object.keys(changedSettings).length === 0) {
			toast.success(t('settings.sections.notificationPreferences.saveSuccess'));
			return;
		}

		setIsSaving(true);
		try {
			const settings = await userService.updateSettings(changedSettings);
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
				<ToggleRow>
					<ToggleLabel>{t('settings.sections.notificationPreferences.tileReminders')}</ToggleLabel>
					<ToggleSwitch
						$isOn={tileReminders}
						$disabled={isLoading}
						onClick={() => !isLoading && setTileReminders(!tileReminders)}
					>
						<ToggleKnob $isOn={tileReminders} />
					</ToggleSwitch>
				</ToggleRow>

				<ToggleRow>
					<ToggleLabel>{t('settings.sections.notificationPreferences.emailNotifications')}</ToggleLabel>
					<ToggleSwitch
						$isOn={emailNotifications}
						$disabled={isLoading}
						onClick={() => !isLoading && setEmailNotifications(!emailNotifications)}
					>
						<ToggleKnob $isOn={emailNotifications} />
					</ToggleSwitch>
				</ToggleRow>

				<ToggleRow>
					<ToggleLabel>{t('settings.sections.notificationPreferences.pushNotifications')}</ToggleLabel>
					<ToggleSwitch
						$isOn={pushNotifications}
						$disabled={isLoading}
						onClick={() => !isLoading && setPushNotifications(!pushNotifications)}
					>
						<ToggleKnob $isOn={pushNotifications} />
					</ToggleSwitch>
				</ToggleRow>
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

const Section = styled.div`
	margin-bottom: 3rem;
`;

const ToggleRow = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 1.5rem 0;
	border-bottom: 1px solid ${palette.colors.gray[900]};

	&:last-child {
		border-bottom: none;
	}
`;

const ToggleLabel = styled.label`
	font-size: ${palette.typography.fontSize.base};
	color: ${palette.colors.white};
	font-weight: ${palette.typography.fontWeight.medium};
`;

const ToggleSwitch = styled.button<{ $isOn: boolean; $disabled?: boolean }>`
	position: relative;
	width: 48px;
	height: 28px;
	background-color: ${(props) =>
		props.$isOn ? palette.colors.brand[500] : palette.colors.gray[700]};
	border: none;
	border-radius: 14px;
	cursor: ${(props) => (props.$disabled ? 'not-allowed' : 'pointer')};
	transition: background-color 0.2s ease;
	padding: 2px;
	opacity: ${(props) => (props.$disabled ? 0.5 : 1)};

	&:hover {
		background-color: ${(props) =>
			props.$disabled
				? props.$isOn
					? palette.colors.brand[500]
					: palette.colors.gray[700]
				: props.$isOn
					? palette.colors.brand[400]
					: palette.colors.gray[600]};
	}
`;

const ToggleKnob = styled.div<{ $isOn: boolean }>`
	position: absolute;
	top: 2px;
	left: ${(props) => (props.$isOn ? '22px' : '2px')};
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

export default NotificationPreferencesSettings;
