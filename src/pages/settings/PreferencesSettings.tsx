import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
// import { X } from 'lucide-react'; // Used in commented-out modal
import { toast } from 'sonner';
import Button from '@/core/common/components/button';
import TimeDropdown from '@/core/common/components/TimeDropdown';
import { userService } from '@/services';

// Interface for custom time restrictions (commented out for now)
// interface CustomTimeRestriction {
// 	day: string;
// 	startTime: string;
// 	endTime: string;
// }

// const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Map API values to UI values
type TransportModeUI = 'bike' | 'drive' | 'bus';
type TransportModeAPI = 'bicycling' | 'driving' | 'transit';

const apiToUiTransportMap: Record<TransportModeAPI, TransportModeUI> = {
	bicycling: 'bike',
	driving: 'drive',
	transit: 'bus',
};

const uiToApiTransportMap: Record<TransportModeUI, TransportModeAPI> = {
	bike: 'bicycling',
	drive: 'driving',
	bus: 'transit',
};

const PreferencesSettings: React.FC = () => {
	const { t } = useTranslation();
	const navigate = useNavigate();

	// Transportation mode
	const [transportMode, setTransportMode] = useState<TransportModeUI>('bus');
	const [originalTransportMode, setOriginalTransportMode] = useState<TransportModeUI>('bus');

	// Bed time
	const [bedTimeStart, setBedTimeStart] = useState('');
	const [bedTimeEnd, setBedTimeEnd] = useState('');

	// Time restrictions state (commented out for now)
	// const [workHoursStart, setWorkHoursStart] = useState('8:00 AM');
	// const [workHoursEnd, setWorkHoursEnd] = useState('5:00 PM');
	// const [personalHoursStart, setPersonalHoursStart] = useState('');
	// const [personalHoursEnd, setPersonalHoursEnd] = useState('');
	// const [showCustomModal, setShowCustomModal] = useState(false);
	// const [customRestrictions, setCustomRestrictions] = useState<CustomTimeRestriction[]>(
	// 	DAYS_OF_WEEK.map(day => ({
	// 		day,
	// 		startTime: '',
	// 		endTime: '',
	// 	}))
	// );

	const [isLoading, setIsLoading] = useState(true);
	const [isSaving, setIsSaving] = useState(false);

	useEffect(() => {
		const fetchSettings = async () => {
			try {
				const settings = await userService.getSettings();
				const { scheduleProfile } = settings;
				const apiValue = scheduleProfile.travelMedium as TransportModeAPI;
				const uiValue = apiToUiTransportMap[apiValue] || 'bus';
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
			const uiValue = apiToUiTransportMap[apiValue] || 'bus';
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

	// Modal handlers (commented out for now)
	// const handleCustomModalSave = () => {
	// 	setShowCustomModal(false);
	// 	toast.success(t('settings.sections.tilePreferences.customSaved'));
	// };
	// const handleCustomModalReset = () => {
	// 	setCustomRestrictions(
	// 		DAYS_OF_WEEK.map(day => ({
	// 			day,
	// 			startTime: '',
	// 			endTime: '',
	// 		}))
	// 	);
	// };

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
							checked={transportMode === 'bike'}
							onChange={() => setTransportMode('bike')}
							disabled={isLoading}
						/>
						<RadioLabel>{t('settings.sections.tilePreferences.byBike')}</RadioLabel>
					</RadioOption>
					<RadioOption>
						<RadioInput
							type="radio"
							name="transport"
							checked={transportMode === 'drive'}
							onChange={() => setTransportMode('drive')}
							disabled={isLoading}
						/>
						<RadioLabel>{t('settings.sections.tilePreferences.iDrive')}</RadioLabel>
					</RadioOption>
					<RadioOption>
						<RadioInput
							type="radio"
							name="transport"
							checked={transportMode === 'bus'}
							onChange={() => setTransportMode('bus')}
							disabled={isLoading}
						/>
						<RadioLabel>{t('settings.sections.tilePreferences.byBus')}</RadioLabel>
					</RadioOption>
				</RadioGroup>
			</Section>

			{/* Define your time restrictions section (commented out for now)
			<Section>
				<SectionTitle>{t('settings.sections.tilePreferences.defineTimeRestrictions')}</SectionTitle>

				<TimeRestrictionRow>
					<TimeRestrictionLabel>{t('settings.sections.tilePreferences.myWorkHours')}:</TimeRestrictionLabel>
					<TimeSelectorsGroup>
						<TimeDropdown
							value={workHoursStart}
							onChange={setWorkHoursStart}
							placeholder="Starts at"
						/>
						<TimeSeparator>-</TimeSeparator>
						<TimeDropdown
							value={workHoursEnd}
							onChange={setWorkHoursEnd}
							placeholder="Ends at"
						/>
					</TimeSelectorsGroup>
					<CustomLink onClick={() => setShowCustomModal(true)}>
						{t('settings.sections.tilePreferences.useCustom')}
					</CustomLink>
				</TimeRestrictionRow>

				<TimeRestrictionRow>
					<TimeRestrictionLabel>{t('settings.sections.tilePreferences.myPersonalHours')}:</TimeRestrictionLabel>
					<TimeSelectorsGroup>
						<TimeDropdown
							value={personalHoursStart}
							onChange={setPersonalHoursStart}
							placeholder="Starts at"
						/>
						<TimeSeparator>-</TimeSeparator>
						<TimeDropdown
							value={personalHoursEnd}
							onChange={setPersonalHoursEnd}
							placeholder="Ends at"
						/>
					</TimeSelectorsGroup>
					<CustomLink onClick={() => setShowCustomModal(true)}>
						{t('settings.sections.tilePreferences.useCustom')}
					</CustomLink>
				</TimeRestrictionRow>
			</Section>
			*/}

			<Section>
				<SectionTitle>{t('settings.sections.tilePreferences.setBlockOutHours')}</SectionTitle>

				<TimeRestrictionRow>
					<TimeRestrictionLabel>{t('settings.sections.tilePreferences.bedTime')}:</TimeRestrictionLabel>
					<TimeSelectorsGroup>
						<TimeDropdown
							value={bedTimeStart}
							onChange={setBedTimeStart}
							placeholder="Starts at"
						/>
						<TimeSeparator>-</TimeSeparator>
						<TimeDropdown
							value={bedTimeEnd}
							onChange={setBedTimeEnd}
							placeholder="Ends at"
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

			{/* Custom Time Restrictions Modal (commented out for now)
			{showCustomModal && (
				<ModalOverlay onClick={() => setShowCustomModal(false)}>
					<ModalContent onClick={(e) => e.stopPropagation()}>
						<ModalHeader>
							<ModalTitle>{t('settings.sections.tilePreferences.customTimeRestrictions')}</ModalTitle>
							<CloseButton onClick={() => setShowCustomModal(false)}>
								<X size={20} />
							</CloseButton>
						</ModalHeader>

						<ModalBody>
							{customRestrictions.map((restriction, index) => (
								<DayRow key={restriction.day}>
									<DayLabel>{restriction.day}</DayLabel>
									<TimeSelectorsGroup>
										<TimeDropdown
											value={restriction.startTime}
											onChange={(value) => {
												const newRestrictions = [...customRestrictions];
												newRestrictions[index].startTime = value;
												setCustomRestrictions(newRestrictions);
											}}
											placeholder="Starts at"
										/>
										<TimeSeparator>-</TimeSeparator>
										<TimeDropdown
											value={restriction.endTime}
											onChange={(value) => {
												const newRestrictions = [...customRestrictions];
												newRestrictions[index].endTime = value;
												setCustomRestrictions(newRestrictions);
											}}
											placeholder="Ends at"
										/>
									</TimeSelectorsGroup>
								</DayRow>
							))}
						</ModalBody>

						<ModalFooter>
							<ResetButton onClick={handleCustomModalReset}>
								{t('settings.sections.tilePreferences.reset')}
							</ResetButton>
							<Button variant="brand" onClick={handleCustomModalSave}>
								{t('settings.sections.tilePreferences.saveChanges')}
							</Button>
						</ModalFooter>
					</ModalContent>
				</ModalOverlay>
			)}
			*/}
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

// Commented out styled components for time restrictions modal (uncomment when needed)
/*
const CustomLink = styled.button`
	background: transparent;
	border: none;
	color: ${({ theme }) => theme.colors.gray[400]};
	font-size: ${({ theme }) => theme.typography.fontSize.sm};
	font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
	cursor: pointer;
	text-decoration: underline;
	padding: 0;
	transition: color 0.2s ease;

	&:hover {
		color: ${({ theme }) => theme.colors.gray[300]};
	}
`;

const ModalOverlay = styled.div`
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background-color: rgba(0, 0, 0, 0.7);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 1000;
	padding: 1rem;
`;

const ModalContent = styled.div`
	background-color: ${({ theme }) => theme.colors.background.card};
	border: 1px solid ${({ theme }) => theme.colors.border.subtle};
	border-radius: ${({ theme }) => theme.borderRadius.large};
	max-width: 600px;
	width: 100%;
	max-height: 90vh;
	display: flex;
	flex-direction: column;
`;

const ModalHeader = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 1.5rem;
	border-bottom: 1px solid ${({ theme }) => theme.colors.border.subtle};
`;

const ModalTitle = styled.h2`
	font-size: ${({ theme }) => theme.typography.fontSize.xl};
	color: ${({ theme }) => theme.colors.text.primary};
	font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
	margin: 0;
`;

const CloseButton = styled.button`
	display: flex;
	align-items: center;
	justify-content: center;
	width: 32px;
	height: 32px;
	background-color: transparent;
	border: none;
	color: ${({ theme }) => theme.colors.gray[400]};
	cursor: pointer;
	border-radius: ${({ theme }) => theme.borderRadius.medium};
	transition: all 0.2s ease;

	&:hover {
		background-color: ${({ theme }) => theme.colors.gray[800]};
		color: ${({ theme }) => theme.colors.text.primary};
	}
`;

const ModalBody = styled.div`
	padding: 1.5rem;
	overflow-y: auto;
	flex: 1;
`;

const DayRow = styled.div`
	display: grid;
	grid-template-columns: 120px 1fr;
	gap: 1.5rem;
	align-items: center;
	padding: 0.75rem 0;

	@media (max-width: 768px) {
		grid-template-columns: 1fr;
		gap: 0.75rem;
	}
`;

const DayLabel = styled.div`
	font-size: ${({ theme }) => theme.typography.fontSize.base};
	color: ${({ theme }) => theme.colors.text.primary};
	font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
`;

const ModalFooter = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 1.5rem;
	border-top: 1px solid ${({ theme }) => theme.colors.border.subtle};
`;

const ResetButton = styled.button`
	background: transparent;
	border: none;
	color: ${({ theme }) => theme.colors.gray[400]};
	font-size: ${({ theme }) => theme.typography.fontSize.sm};
	font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
	cursor: pointer;
	padding: 0;
	transition: color 0.2s ease;

	&:hover {
		color: ${({ theme }) => theme.colors.gray[300]};
	}
`;
*/

export default PreferencesSettings;
