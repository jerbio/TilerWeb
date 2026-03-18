import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import useAuthNavigate from '@/hooks/useNavigateHome';
import { toast } from 'sonner';
import Button from '@/core/common/components/button';
import TimeDropdown from '@/core/common/components/TimeDropdown';
import WeeklySchedule, {
	WeeklyScheduleSize,
	type DaySchedule,
} from '@/core/common/components/WeeklySchedule';
import { userService } from '@/services';
import {
	calculateSleepDurationMs,
	calculateBedTimeEnd,
	normalizeTimeString,
} from '@/core/common/utils/timeUtils';
import {
	restrictionProfileToSchedule,
	scheduleToWeekDayOptions,
	isScheduleActive,
} from '@/core/common/utils/restrictionUtils';

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
	const navigate = useAuthNavigate();

	// Transportation mode
	const [transportMode, setTransportMode] = useState<TransportModeUI>(TransportModeUI.Drive);
	const [originalTransportMode, setOriginalTransportMode] = useState<TransportModeUI>(
		TransportModeUI.Drive
	);

	// Bed time
	const [bedTimeStart, setBedTimeStart] = useState('');
	const [bedTimeEnd, setBedTimeEnd] = useState('');
	const [originalBedTimeStart, setOriginalBedTimeStart] = useState('');
	const [originalBedTimeEnd, setOriginalBedTimeEnd] = useState('');

	const [isLoading, setIsLoading] = useState(true);
	const [isSaving, setIsSaving] = useState(false);

	// Work hours restriction
	const [workSchedule, setWorkSchedule] = useState<DaySchedule[]>(() =>
		Array.from({ length: 7 }, (_, i) => ({ dayIndex: i, startTime: '', endTime: '' }))
	);
	const [originalWorkSchedule, setOriginalWorkSchedule] = useState<DaySchedule[]>([]);
	const [workProfileId, setWorkProfileId] = useState<string>('');

	// Personal hours restriction
	const [personalSchedule, setPersonalSchedule] = useState<DaySchedule[]>(() =>
		Array.from({ length: 7 }, (_, i) => ({ dayIndex: i, startTime: '', endTime: '' }))
	);
	const [originalPersonalSchedule, setOriginalPersonalSchedule] = useState<DaySchedule[]>([]);
	const [personalProfileId, setPersonalProfileId] = useState<string>('');

	useEffect(() => {
		const fetchSettings = async () => {
			try {
				const [settings, scheduleProfile] = await Promise.all([
					userService.getSettings(),
					userService.getScheduleProfile(),
				]);
				const { scheduleProfile: sp } = settings;

				// Transport mode
				const apiValue = sp.travelMedium as TransportModeAPI;
				const uiValue = apiToUiTransportMap[apiValue] || TransportModeUI.Drive;
				setTransportMode(uiValue);
				setOriginalTransportMode(uiValue);

				// Bed time
				const rawStartTime = sp.endTimeOfDay || '';
				const startTime = normalizeTimeString(rawStartTime);
				const sleepDuration = sp.sleepDuration || 0;
				const endTime =
					startTime && sleepDuration > 0
						? calculateBedTimeEnd(startTime, sleepDuration)
						: '';

				setBedTimeStart(startTime);
				setBedTimeEnd(endTime);
				setOriginalBedTimeStart(startTime);
				setOriginalBedTimeEnd(endTime);

				// Work hours restriction
				const workSched = restrictionProfileToSchedule(
					scheduleProfile.workHoursRestrictionProfile
				);
				setWorkSchedule(workSched);
				setOriginalWorkSchedule(workSched);
				setWorkProfileId(scheduleProfile.workHoursRestrictionProfile?.id || '');

				// Personal hours restriction
				const personalSched = restrictionProfileToSchedule(
					scheduleProfile.personalHoursRestrictionProfile
				);
				setPersonalSchedule(personalSched);
				setOriginalPersonalSchedule(personalSched);
				setPersonalProfileId(scheduleProfile.personalHoursRestrictionProfile?.id || '');
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
		// Validate schedule profiles: each day must have both start and end, or neither
		const dayNameKeys = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
		for (const day of workSchedule) {
			if ((day.startTime && !day.endTime) || (!day.startTime && day.endTime)) {
				toast.error(
					t('settings.sections.tilePreferences.scheduleIncompleteDay', {
						label: t('settings.sections.tilePreferences.myWorkHours'),
						day: t(
							`settings.sections.tilePreferences.dayNames.${dayNameKeys[day.dayIndex]}`
						),
					})
				);
				return;
			}
		}
		for (const day of personalSchedule) {
			if ((day.startTime && !day.endTime) || (!day.startTime && day.endTime)) {
				toast.error(
					t('settings.sections.tilePreferences.scheduleIncompleteDay', {
						label: t('settings.sections.tilePreferences.myPersonalHours'),
						day: t(
							`settings.sections.tilePreferences.dayNames.${dayNameKeys[day.dayIndex]}`
						),
					})
				);
				return;
			}
		}

		// Validate bed time: both must be set or both must be empty
		const hasBedTimeStart = bedTimeStart !== '';
		const hasBedTimeEnd = bedTimeEnd !== '';

		if (hasBedTimeStart && !hasBedTimeEnd) {
			toast.error(t('settings.sections.tilePreferences.bedTimeEndRequired'));
			return;
		}

		if (!hasBedTimeStart && hasBedTimeEnd) {
			toast.error(t('settings.sections.tilePreferences.bedTimeStartRequired'));
			return;
		}

		// Build object with only changed fields
		const changedScheduleProfile: Record<string, string | number> = {};

		if (transportMode !== originalTransportMode) {
			changedScheduleProfile.TravelMedium = uiToApiTransportMap[transportMode];
		}

		// Check if bed time changed
		const bedTimeChanged =
			bedTimeStart !== originalBedTimeStart || bedTimeEnd !== originalBedTimeEnd;

		if (bedTimeChanged && bedTimeStart && bedTimeEnd) {
			const newSleepDuration = calculateSleepDurationMs(bedTimeStart, bedTimeEnd);
			changedScheduleProfile.SleepDuration = newSleepDuration;
			changedScheduleProfile.EndTimeOfDay = bedTimeStart;
		}

		// Check if restriction profiles changed
		const workChanged = JSON.stringify(workSchedule) !== JSON.stringify(originalWorkSchedule);
		const personalChanged =
			JSON.stringify(personalSchedule) !== JSON.stringify(originalPersonalSchedule);

		// If nothing changed, don't make API call
		if (Object.keys(changedScheduleProfile).length === 0 && !workChanged && !personalChanged) {
			toast.success(t('settings.sections.tilePreferences.saveSuccess'));
			return;
		}

		setIsSaving(true);
		try {
			// Save settings (transport, bed time) if changed
			if (Object.keys(changedScheduleProfile).length > 0) {
				const settings = await userService.updateSettings({
					ScheduleProfile: changedScheduleProfile,
				});
				const { scheduleProfile } = settings;

				const apiValue = scheduleProfile.travelMedium as TransportModeAPI;
				const uiValue = apiToUiTransportMap[apiValue] || TransportModeUI.Drive;
				setTransportMode(uiValue);
				setOriginalTransportMode(uiValue);

				const rawStartTime = scheduleProfile.endTimeOfDay || '';
				const startTime = normalizeTimeString(rawStartTime);
				const sleepDuration = scheduleProfile.sleepDuration || 0;
				const endTime =
					startTime && sleepDuration > 0
						? calculateBedTimeEnd(startTime, sleepDuration)
						: '';

				setBedTimeStart(startTime);
				setBedTimeEnd(endTime);
				setOriginalBedTimeStart(startTime);
				setOriginalBedTimeEnd(endTime);
			}

			// Save restriction profiles if changed
			if (workChanged || personalChanged) {
				const profileParams: Record<string, unknown> = {};

				if (workChanged) {
					const workActive = isScheduleActive(workSchedule);
					profileParams.WorkRestrictionProfile = {
						Id: workProfileId || undefined,
						IsEnabled: workActive,
						RestrictiveWeek: {
							WeekDayOption: scheduleToWeekDayOptions(workSchedule),
							isEnabled: workActive ? 'true' : 'false',
						},
					};
				}

				if (personalChanged) {
					const personalActive = isScheduleActive(personalSchedule);
					profileParams.PersonalRestrictionProfile = {
						Id: personalProfileId || undefined,
						IsEnabled: personalActive,
						RestrictiveWeek: {
							WeekDayOption: scheduleToWeekDayOptions(personalSchedule),
							isEnabled: personalActive ? 'true' : 'false',
						},
					};
				}

				const updatedProfile = await userService.updateScheduleProfile(profileParams);

				const newWorkSched = restrictionProfileToSchedule(
					updatedProfile.workHoursRestrictionProfile
				);
				setWorkSchedule(newWorkSched);
				setOriginalWorkSchedule(newWorkSched);
				setWorkProfileId(updatedProfile.workHoursRestrictionProfile?.id || '');

				const newPersonalSched = restrictionProfileToSchedule(
					updatedProfile.personalHoursRestrictionProfile
				);
				setPersonalSchedule(newPersonalSched);
				setOriginalPersonalSchedule(newPersonalSched);
				setPersonalProfileId(updatedProfile.personalHoursRestrictionProfile?.id || '');
			}

			toast.success(t('settings.sections.tilePreferences.saveSuccess'));
		} catch (error) {
			toast.error(t('settings.sections.tilePreferences.saveError'));
			console.error('Failed to save changes:', error);
		} finally {
			setIsSaving(false);
		}
	};

	const handleWorkScheduleChange = useCallback(
		(dayIndex: number, field: 'startTime' | 'endTime', value: string) => {
			setWorkSchedule((prev) =>
				prev.map((day) => (day.dayIndex === dayIndex ? { ...day, [field]: value } : day))
			);
		},
		[]
	);

	const handleWorkDayToggle = useCallback(
		(dayIndex: number, selected: boolean) => {
			setWorkSchedule((prev) =>
				prev.map((day) =>
					day.dayIndex === dayIndex
						? {
								...day,
								startTime: selected
									? t('settings.sections.tilePreferences.defaultStartTime')
									: '',
								endTime: selected
									? t('settings.sections.tilePreferences.defaultEndTime')
									: '',
							}
						: day
				)
			);
		},
		[t]
	);

	const handlePersonalScheduleChange = useCallback(
		(dayIndex: number, field: 'startTime' | 'endTime', value: string) => {
			setPersonalSchedule((prev) =>
				prev.map((day) => (day.dayIndex === dayIndex ? { ...day, [field]: value } : day))
			);
		},
		[]
	);

	const handlePersonalDayToggle = useCallback(
		(dayIndex: number, selected: boolean) => {
			setPersonalSchedule((prev) =>
				prev.map((day) =>
					day.dayIndex === dayIndex
						? {
								...day,
								startTime: selected
									? t('settings.sections.tilePreferences.defaultStartTime')
									: '',
								endTime: selected
									? t('settings.sections.tilePreferences.defaultEndTime')
									: '',
							}
						: day
				)
			);
		},
		[t]
	);

	return (
		<Container>
			<Breadcrumb>
				<BreadcrumbLink onClick={() => navigate('home')}>
					{t('settings.breadcrumb.home')}
				</BreadcrumbLink>
				<BreadcrumbSeparator>/</BreadcrumbSeparator>
				<BreadcrumbLink onClick={() => navigate('/settings')}>
					{t('settings.breadcrumb.settings')}
				</BreadcrumbLink>
				<BreadcrumbSeparator>/</BreadcrumbSeparator>
				<BreadcrumbCurrent>
					{t('settings.sections.tilePreferences.title')}
				</BreadcrumbCurrent>
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
						<RadioLabel>{t('settings.sections.tilePreferences.cycling')}</RadioLabel>
					</RadioOption>
					<RadioOption>
						<RadioInput
							type="radio"
							name="transport"
							checked={transportMode === TransportModeUI.Drive}
							onChange={() => setTransportMode(TransportModeUI.Drive)}
							disabled={isLoading}
						/>
						<RadioLabel>{t('settings.sections.tilePreferences.driving')}</RadioLabel>
					</RadioOption>
					<RadioOption>
						<RadioInput
							type="radio"
							name="transport"
							checked={transportMode === TransportModeUI.Bus}
							onChange={() => setTransportMode(TransportModeUI.Bus)}
							disabled={isLoading}
						/>
						<RadioLabel>{t('settings.sections.tilePreferences.transit')}</RadioLabel>
					</RadioOption>
				</RadioGroup>
			</Section>

			<Section>
				<SectionTitle>
					{t('settings.sections.tilePreferences.defineTimeRestrictions')}
				</SectionTitle>

				<RestrictionBlock>
					<RestrictionLabel>
						{t('settings.sections.tilePreferences.myWorkHours')}:
					</RestrictionLabel>
					<WeeklySchedule
						schedule={workSchedule}
						onChange={handleWorkScheduleChange}
						onDayToggle={handleWorkDayToggle}
						disabled={isLoading}
						size={WeeklyScheduleSize.Sm}
					/>
				</RestrictionBlock>

				<RestrictionBlock>
					<RestrictionLabel>
						{t('settings.sections.tilePreferences.myPersonalHours')}:
					</RestrictionLabel>
					<WeeklySchedule
						schedule={personalSchedule}
						onChange={handlePersonalScheduleChange}
						onDayToggle={handlePersonalDayToggle}
						disabled={isLoading}
						size={WeeklyScheduleSize.Sm}
					/>
				</RestrictionBlock>
			</Section>

			<Section>
				<SectionTitle>
					{t('settings.sections.tilePreferences.setBlockOutHours')}
				</SectionTitle>

				<TimeRestrictionRow data-testid="bed-time-section">
					<TimeRestrictionLabel>
						{t('settings.sections.tilePreferences.bedTime')}:
					</TimeRestrictionLabel>
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
				<Button
					variant="brand"
					onClick={handleSaveChanges}
					disabled={isSaving || isLoading}
				>
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

const RestrictionBlock = styled.div`
	margin-bottom: 2rem;
`;

const RestrictionLabel = styled.h4`
	font-size: ${({ theme }) => theme.typography.fontSize.base};
	color: ${({ theme }) => theme.colors.text.primary};
	font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
	margin: 0 0 1rem 0;
`;

export default PreferencesSettings;
