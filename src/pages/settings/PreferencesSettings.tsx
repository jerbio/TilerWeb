import React, { useState } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import palette from '@/core/theme/palette';
import Button from '@/core/common/components/button';

interface CustomTimeRestriction {
	day: string;
	startTime: string;
	endTime: string;
}

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const PreferencesSettings: React.FC = () => {
	const { t } = useTranslation();
	const navigate = useNavigate();

	// Transportation mode
	const [transportMode, setTransportMode] = useState<'bike' | 'drive' | 'bus'>('bus');

	// Work hours
	const [workHoursStart, setWorkHoursStart] = useState('8:00AM');
	const [workHoursEnd, setWorkHoursEnd] = useState('4:45PM');

	// Personal hours
	const [personalHoursStart, setPersonalHoursStart] = useState('Starts at');
	const [personalHoursEnd, setPersonalHoursEnd] = useState('Ends at');

	// Bed time
	const [bedTimeStart, setBedTimeStart] = useState('Starts at');
	const [bedTimeEnd, setBedTimeEnd] = useState('Ends at');

	// Modal state
	const [showCustomModal, setShowCustomModal] = useState(false);
	const [customRestrictions, setCustomRestrictions] = useState<CustomTimeRestriction[]>(
		DAYS_OF_WEEK.map(day => ({
			day,
			startTime: 'Starts at',
			endTime: 'Ends at',
		}))
	);

	const [isSaving, setIsSaving] = useState(false);

	const handleSaveChanges = async () => {
		setIsSaving(true);
		try {
			// TODO: Implement save functionality with backend
			await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate API call
			toast.success(t('settings.sections.tilePreferences.saveSuccess'));
		} catch (error) {
			toast.error(t('settings.sections.tilePreferences.saveError'));
			console.error('Failed to save changes:', error);
		} finally {
			setIsSaving(false);
		}
	};

	const handleCustomModalSave = () => {
		setShowCustomModal(false);
		toast.success(t('settings.sections.tilePreferences.customSaved'));
	};

	const handleCustomModalReset = () => {
		setCustomRestrictions(
			DAYS_OF_WEEK.map(day => ({
				day,
				startTime: 'Starts at',
				endTime: 'Ends at',
			}))
		);
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
							checked={transportMode === 'bike'}
							onChange={() => setTransportMode('bike')}
						/>
						<RadioLabel>{t('settings.sections.tilePreferences.byBike')}</RadioLabel>
					</RadioOption>
					<RadioOption>
						<RadioInput
							type="radio"
							name="transport"
							checked={transportMode === 'drive'}
							onChange={() => setTransportMode('drive')}
						/>
						<RadioLabel>{t('settings.sections.tilePreferences.iDrive')}</RadioLabel>
					</RadioOption>
					<RadioOption>
						<RadioInput
							type="radio"
							name="transport"
							checked={transportMode === 'bus'}
							onChange={() => setTransportMode('bus')}
						/>
						<RadioLabel>{t('settings.sections.tilePreferences.byBus')}</RadioLabel>
					</RadioOption>
				</RadioGroup>
			</Section>

			<Section>
				<SectionTitle>{t('settings.sections.tilePreferences.defineTimeRestrictions')}</SectionTitle>

				<TimeRestrictionRow>
					<TimeRestrictionLabel>{t('settings.sections.tilePreferences.myWorkHours')}:</TimeRestrictionLabel>
					<TimeSelectorsGroup>
						<TimeSelect value={workHoursStart} onChange={(e) => setWorkHoursStart(e.target.value)}>
							<option>8:00AM</option>
							<option>9:00AM</option>
							<option>10:00AM</option>
						</TimeSelect>
						<TimeSeparator>-</TimeSeparator>
						<TimeSelect value={workHoursEnd} onChange={(e) => setWorkHoursEnd(e.target.value)}>
							<option>4:45PM</option>
							<option>5:00PM</option>
							<option>6:00PM</option>
						</TimeSelect>
					</TimeSelectorsGroup>
					<CustomLink onClick={() => setShowCustomModal(true)}>
						{t('settings.sections.tilePreferences.useCustom')}
					</CustomLink>
				</TimeRestrictionRow>

				<TimeRestrictionRow>
					<TimeRestrictionLabel>{t('settings.sections.tilePreferences.myPersonalHours')}:</TimeRestrictionLabel>
					<TimeSelectorsGroup>
						<TimeSelect value={personalHoursStart} onChange={(e) => setPersonalHoursStart(e.target.value)}>
							<option>Starts at</option>
							<option>6:00AM</option>
							<option>7:00AM</option>
						</TimeSelect>
						<TimeSeparator>-</TimeSeparator>
						<TimeSelect value={personalHoursEnd} onChange={(e) => setPersonalHoursEnd(e.target.value)}>
							<option>Ends at</option>
							<option>10:00PM</option>
							<option>11:00PM</option>
						</TimeSelect>
					</TimeSelectorsGroup>
					<CustomLink onClick={() => setShowCustomModal(true)}>
						{t('settings.sections.tilePreferences.useCustom')}
					</CustomLink>
				</TimeRestrictionRow>
			</Section>

			<Section>
				<SectionTitle>{t('settings.sections.tilePreferences.setBlockOutHours')}</SectionTitle>

				<TimeRestrictionRow>
					<TimeRestrictionLabel>{t('settings.sections.tilePreferences.bedTime')}:</TimeRestrictionLabel>
					<TimeSelectorsGroup>
						<TimeSelect value={bedTimeStart} onChange={(e) => setBedTimeStart(e.target.value)}>
							<option>Starts at</option>
							<option>9:00PM</option>
							<option>10:00PM</option>
							<option>11:00PM</option>
						</TimeSelect>
						<TimeSeparator>-</TimeSeparator>
						<TimeSelect value={bedTimeEnd} onChange={(e) => setBedTimeEnd(e.target.value)}>
							<option>Ends at</option>
							<option>6:00AM</option>
							<option>7:00AM</option>
							<option>8:00AM</option>
						</TimeSelect>
					</TimeSelectorsGroup>
				</TimeRestrictionRow>
			</Section>

			<SaveButtonContainer>
				<Button variant="brand" onClick={handleSaveChanges} disabled={isSaving}>
					{isSaving
						? t('settings.sections.tilePreferences.saving')
						: t('settings.sections.tilePreferences.saveChanges')}
				</Button>
			</SaveButtonContainer>

			{/* Custom Time Restrictions Modal */}
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
										<TimeSelect
											value={restriction.startTime}
											onChange={(e) => {
												const newRestrictions = [...customRestrictions];
												newRestrictions[index].startTime = e.target.value;
												setCustomRestrictions(newRestrictions);
											}}
										>
											<option>Starts at</option>
											<option>6:00AM</option>
											<option>7:00AM</option>
											<option>8:00AM</option>
											<option>9:00AM</option>
										</TimeSelect>
										<TimeSeparator>-</TimeSeparator>
										<TimeSelect
											value={restriction.endTime}
											onChange={(e) => {
												const newRestrictions = [...customRestrictions];
												newRestrictions[index].endTime = e.target.value;
												setCustomRestrictions(newRestrictions);
											}}
										>
											<option>Ends at</option>
											<option>4:00PM</option>
											<option>5:00PM</option>
											<option>6:00PM</option>
											<option>7:00PM</option>
										</TimeSelect>
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

const SectionTitle = styled.h3`
	font-size: ${palette.typography.fontSize.lg};
	color: ${palette.colors.white};
	font-weight: ${palette.typography.fontWeight.semibold};
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
	width: 20px;
	height: 20px;
	accent-color: ${palette.colors.brand[500]};
	cursor: pointer;
`;

const RadioLabel = styled.span`
	font-size: ${palette.typography.fontSize.base};
	color: ${palette.colors.white};
	font-weight: ${palette.typography.fontWeight.normal};
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
	font-size: ${palette.typography.fontSize.base};
	color: ${palette.colors.white};
	font-weight: ${palette.typography.fontWeight.medium};
`;

const TimeSelectorsGroup = styled.div`
	display: flex;
	align-items: center;
	gap: 0.75rem;
`;

const TimeSelect = styled.select`
	appearance: none;
	background-color: ${palette.colors.gray[900]};
	border: 1px solid ${palette.colors.gray[800]};
	border-radius: ${palette.borderRadius.medium};
	color: ${palette.colors.white};
	padding: 0.75rem 2.5rem 0.75rem 1rem;
	font-size: ${palette.typography.fontSize.sm};
	font-weight: ${palette.typography.fontWeight.medium};
	cursor: pointer;
	background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23A3A3A3' d='M6 9L1 4h10z'/%3E%3C/svg%3E");
	background-repeat: no-repeat;
	background-position: right 0.75rem center;
	transition: border-color 0.2s ease;

	&:hover {
		border-color: ${palette.colors.gray[700]};
	}

	&:focus {
		outline: none;
		border-color: ${palette.colors.brand[500]};
		box-shadow: 0 0 0 2px ${palette.colors.brand[500]}33;
	}
`;

const TimeSeparator = styled.span`
	color: ${palette.colors.gray[500]};
	font-size: ${palette.typography.fontSize.base};
`;

const CustomLink = styled.button`
	background: transparent;
	border: none;
	color: ${palette.colors.gray[400]};
	font-size: ${palette.typography.fontSize.sm};
	font-weight: ${palette.typography.fontWeight.medium};
	cursor: pointer;
	text-decoration: underline;
	padding: 0;
	transition: color 0.2s ease;

	&:hover {
		color: ${palette.colors.gray[300]};
	}
`;

const SaveButtonContainer = styled.div`
	display: flex;
	justify-content: flex-end;
`;

// Modal styles
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
	background-color: ${palette.colors.gray[900]};
	border: 1px solid ${palette.colors.gray[800]};
	border-radius: ${palette.borderRadius.large};
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
	border-bottom: 1px solid ${palette.colors.gray[800]};
`;

const ModalTitle = styled.h2`
	font-size: ${palette.typography.fontSize.xl};
	color: ${palette.colors.white};
	font-weight: ${palette.typography.fontWeight.semibold};
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
	color: ${palette.colors.gray[400]};
	cursor: pointer;
	border-radius: ${palette.borderRadius.medium};
	transition: all 0.2s ease;

	&:hover {
		background-color: ${palette.colors.gray[800]};
		color: ${palette.colors.white};
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
	font-size: ${palette.typography.fontSize.base};
	color: ${palette.colors.white};
	font-weight: ${palette.typography.fontWeight.medium};
`;

const ModalFooter = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 1.5rem;
	border-top: 1px solid ${palette.colors.gray[800]};
`;

const ResetButton = styled.button`
	background: transparent;
	border: none;
	color: ${palette.colors.gray[400]};
	font-size: ${palette.typography.fontSize.sm};
	font-weight: ${palette.typography.fontWeight.medium};
	cursor: pointer;
	padding: 0;
	transition: color 0.2s ease;

	&:hover {
		color: ${palette.colors.gray[300]};
	}
`;

export default PreferencesSettings;
