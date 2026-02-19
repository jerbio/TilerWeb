import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import Button from '@/core/common/components/button';
import TimeDropdown from '@/core/common/components/TimeDropdown';
import { userService } from '@/services';


// Map API values to UI values
enum TransportModeUI {
	Bike = 'bike',
	Drive = 'drive',
	Bus = 'bus',
}

enum TransportModeAPI {
	Bicycling = 'bicycling',
	Driving = 'driving',
	Transit = 'transit',
}

const apiToUiTransportMap: Record<TransportModeAPI, TransportModeUI> = {
	[TransportModeAPI.Bicycling]: TransportModeUI.Bike,
	[TransportModeAPI.Driving]: TransportModeUI.Drive,
	[TransportModeAPI.Transit]: TransportModeUI.Bus,
};

const uiToApiTransportMap: Record<TransportModeUI, TransportModeAPI> = {
	[TransportModeUI.Bike]: TransportModeAPI.Bicycling,
	[TransportModeUI.Drive]: TransportModeAPI.Driving,
	[TransportModeUI.Bus]: TransportModeAPI.Transit,
};

const PreferencesSettings: React.FC = () => {
	const { t } = useTranslation();
	const navigate = useNavigate();

	// Transportation mode
	const [transportMode, setTransportMode] = useState<TransportModeUI>(TransportModeUI.Drive);
	const [originalTransportMode, setOriginalTransportMode] = useState<TransportModeUI>(TransportModeUI.Drive);

	// Bed time
	const [bedTimeStart, setBedTimeStart] = useState('');
	const [bedTimeEnd, setBedTimeEnd] = useState('');

	const [isLoading, setIsLoading] = useState(true);
	const [isSaving, setIsSaving] = useState(false);

	useEffect(() => {
		const fetchSettings = async () => {
			try {
				const settings = await userService.getSettings();
				const { scheduleProfile } = settings;
				const apiValue = scheduleProfile.travelMedium as TransportModeAPI;
				const uiValue = apiToUiTransportMap[apiValue] || TransportModeUI.Drive;
				setTransportMode(uiValue);
				setOriginalTransportMode(uiValue);
			} catch (error) {
				console.error('Failed to fetch settings:', error);
				toast.error(t('settings.sections.tilePreferences.saveError'));
			} finally {
				setIsLoading(false);
			}
		};

		fetchSettings();
	}, [t]);

	const handleSaveChanges = async () => {
		// Build object with only changed fields
		const changedScheduleProfile: Record<string, string> = {};

		if (transportMode !== originalTransportMode) {
			changedScheduleProfile.TravelMedium = uiToApiTransportMap[transportMode];
		}

		// If nothing changed, don't make API call
		if (Object.keys(changedScheduleProfile).length === 0) {
			toast.success(t('settings.sections.tilePreferences.saveSuccess'));
			return;
		}

		setIsSaving(true);
		try {
			const settings = await userService.updateSettings({
				ScheduleProfile: changedScheduleProfile,
			});
			// Update state with server response
			const { scheduleProfile } = settings;
			const apiValue = scheduleProfile.travelMedium as TransportModeAPI;
			const uiValue = apiToUiTransportMap[apiValue] || TransportModeUI.Drive;
			setTransportMode(uiValue);
			setOriginalTransportMode(uiValue);
			toast.success(t('settings.sections.tilePreferences.saveSuccess'));
		} catch (error) {
			toast.error(t('settings.sections.tilePreferences.saveError'));
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
				<BreadcrumbCurrent>{t('settings.sections.tilePreferences.title')}</BreadcrumbCurrent>
			</Breadcrumb>

			<Header>
				<Title>{t('settings.sections.tilePreferences.title')}</Title>
				<Description>{t('settings.sections.tilePreferences.description')}</Description>
			</Header>

			<Section>
				<SectionTitle>{t('settings.sections.tilePreferences.howMoveAround')}</SectionTitle>
				<RadioGroup>
					<RadioOption>
						<RadioInput
							type="radio"
							name="transport"
							checked={transportMode === TransportModeUI.Bike}
							onChange={() => setTransportMode(TransportModeUI.Bike)}
							disabled={isLoading}
						/>
						<RadioLabel>{t('settings.sections.tilePreferences.byBike')}</RadioLabel>
					</RadioOption>
					<RadioOption>
						<RadioInput
							type="radio"
							name="transport"
							checked={transportMode === TransportModeUI.Drive}
							onChange={() => setTransportMode(TransportModeUI.Drive)}
							disabled={isLoading}
						/>
						<RadioLabel>{t('settings.sections.tilePreferences.iDrive')}</RadioLabel>
					</RadioOption>
					<RadioOption>
						<RadioInput
							type="radio"
							name="transport"
							checked={transportMode === TransportModeUI.Bus}
							onChange={() => setTransportMode(TransportModeUI.Bus)}
							disabled={isLoading}
						/>
						<RadioLabel>{t('settings.sections.tilePreferences.byBus')}</RadioLabel>
					</RadioOption>
				</RadioGroup>
			</Section>

			<Section>
				<SectionTitle>{t('settings.sections.tilePreferences.setBlockOutHours')}</SectionTitle>

				<TimeRestrictionRow>
					<TimeRestrictionLabel>{t('settings.sections.tilePreferences.bedTime')}:</TimeRestrictionLabel>
					<TimeSelectorsGroup>
						<TimeDropdown
							value={bedTimeStart}
							onChange={setBedTimeStart}
							placeholder={t('settings.sections.tilePreferences.startsAt')}
						/>
						<TimeSeparator>-</TimeSeparator>
						<TimeDropdown
							value={bedTimeEnd}
							onChange={setBedTimeEnd}
							placeholder={t('settings.sections.tilePreferences.endsAt')}
						/>
					</TimeSelectorsGroup>
				</TimeRestrictionRow>
			</Section>

			<SaveButtonContainer>
				<Button variant="brand" onClick={handleSaveChanges} disabled={isSaving || isLoading}>
					{isSaving
						? t('settings.sections.tilePreferences.saving')
						: t('settings.sections.tilePreferences.saveChanges')}
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

const SectionTitle = styled.h3`
	font-size: ${({ theme }) => theme.typography.fontSize.lg};
	color: ${({ theme }) => theme.colors.text.primary};
	font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
	margin: 0 0 1.5rem 0;
`;

const RadioGroup = styled.div`
	display: flex;
	gap: 2rem;
	align-items: center;
`;

const RadioOption = styled.label`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	cursor: pointer;
`;

const RadioInput = styled.input`
	appearance: none;
	width: 20px;
	height: 20px;
	border: 2px solid ${({ theme }) => theme.colors.gray[400]};
	border-radius: 50%;
	background-color: transparent;
	cursor: pointer;
	transition: all 0.2s ease;
	position: relative;

	&:checked {
		border-color: ${({ theme }) => theme.colors.brand[500]};
	}

	&:checked::after {
		content: '';
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		width: 10px;
		height: 10px;
		border-radius: 50%;
		background-color: ${({ theme }) => theme.colors.brand[500]};
	}

	&:hover:not(:disabled) {
		border-color: ${({ theme }) => theme.colors.brand[400]};
	}

	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
`;

const RadioLabel = styled.span`
	font-size: ${({ theme }) => theme.typography.fontSize.base};
	color: ${({ theme }) => theme.colors.text.primary};
	font-weight: ${({ theme }) => theme.typography.fontWeight.normal};
`;

const TimeRestrictionRow = styled.div`
	display: grid;
	grid-template-columns: 180px 1fr auto;
	gap: 1.5rem;
	align-items: center;
	margin-bottom: 1.5rem;

	@media (max-width: 768px) {
		grid-template-columns: 1fr;
		gap: 1rem;
	}
`;

const TimeRestrictionLabel = styled.label`
	font-size: ${({ theme }) => theme.typography.fontSize.base};
	color: ${({ theme }) => theme.colors.text.primary};
	font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
`;

const TimeSelectorsGroup = styled.div`
	display: flex;
	align-items: center;
	gap: 0.75rem;
`;

const TimeSeparator = styled.span`
	color: ${({ theme }) => theme.colors.text.secondary};
	font-size: ${({ theme }) => theme.typography.fontSize.base};
`;

const SaveButtonContainer = styled.div`
	display: flex;
	justify-content: flex-end;
`;

export default PreferencesSettings;
