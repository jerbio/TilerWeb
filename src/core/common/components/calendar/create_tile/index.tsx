import useFormHandler from '@/hooks/useFormHandler';
import { Calendar, Keyboard, X } from 'lucide-react';
import styled, { useTheme as useStyledTheme } from 'styled-components';
import dayjs from 'dayjs';
import Button from '../../button';
import { RGBColor } from '@/core/util/colors';
import React, { useCallback, useEffect, useMemo } from 'react';
import AutosizeInput from '../../auto-size-input';
import advancedFormat from 'dayjs/plugin/advancedFormat';
import { Trans, useTranslation } from 'react-i18next';
import LoadingModal from '../../modals/loading-modal';
import SuccessModal from '../../modals/success-modal';
import { scheduleService } from '@/services';
import {
	ScheduleCreateEventParams,
	ScheduleRepeatEndType,
	ScheduleRepeatFrequency,
	ScheduleRepeatStartType,
	ScheduleRepeatType,
	ScheduleRepeatWeekday,
	ScheduleRepeatWeeklyData,
} from '../../../types/schedule';
import { toast } from 'sonner';
import DatePicker from '../../date_picker';
import { useCalendarDispatch } from '../CalendarRequestProvider';
import {
	CalendarEntityType,
	CalendarRequestResult,
	CalendarRequestStatus,
	CalendarRequestType,
} from '../calendarRequestContext';
import { Actions } from '@/core/constants/enums';
import { useCalendarUI } from '../calendar-ui.provider';
import Summary from './summary';
import Options from './options';

dayjs.extend(advancedFormat);

export type InitialCreateTileFormState = {
	start: dayjs.Dayjs;
	action: string;
	location: string;
	durationHours: number;
	durationMins: number;
	deadline: dayjs.Dayjs;
	color: RGBColor;
	isRecurring: boolean;
	recurrenceType: ScheduleRepeatType;
	recurrenceFrequency: ScheduleRepeatFrequency;
	recurrenceWeeklyDays: ScheduleRepeatWeekday[];
	recurrenceStartType: ScheduleRepeatStartType;
	recurrenceStartDate: dayjs.Dayjs;
	recurrenceEndType: ScheduleRepeatEndType;
	recurrenceEndDate: dayjs.Dayjs;
	isTimeRestricted: boolean;
	timeRestrictionType: null;
	timeRestrictionStart: string;
	timeRestrictionEnd: string;
	hasLocationNickname: boolean;
	locationNickname: string;
};

type CalendarCreateTileProps = {
	formHandler: ReturnType<typeof useFormHandler<InitialCreateTileFormState>>;
	refetchEvents: () => Promise<void>;
};

const CalendarCreateTile: React.FC<CalendarCreateTileProps> = ({ formHandler, refetchEvents }) => {
	const ui = useCalendarUI((state) => state.createTile);
	const { formData, handleFormInputChange, resetForm } = formHandler;
	const theme = useStyledTheme();
	const { t } = useTranslation();

	const isValidSubmission = useMemo(() => {
		if (formData.action.trim().length === 0) return false;
		const duration = formData.durationHours * 60 + formData.durationMins;
		if (duration === 0) return false;
		return true;
	}, [formData]);
	const calendarDispatch = useCalendarDispatch();

	function closeModal() {
		resetForm();
		ui.actions.close();
		ui.actions.collapse();
	}

	const submitForm = useCallback(async () => {
		if (!isValidSubmission) return;
		ui.actions.startLoading(formData.action);
		try {
			const event: ScheduleCreateEventParams = {
				Name: formData.action,
				RColor: formData.color.r.toString(),
				GColor: formData.color.g.toString(),
				BColor: formData.color.b.toString(),
				LocationAddress: formData.location,
				DurationDays: '0',
				DurationHours: formData.durationHours.toString(),
				DurationMinute: formData.durationMins.toString(),
				EndYear: dayjs(formData.deadline).format('YYYY'),
				EndMonth: dayjs(formData.deadline).format('MM'),
				EndDay: dayjs(formData.deadline).format('DD'),
				EndHour: '23',
				EndMinute: '59',
				isRestricted: 'false',
				MobileApp: true,
			};

			// Repetition
			if (formData.isRecurring) {
				event.RepeatType = formData.recurrenceType;
				event.RepeatFrequency = formData.recurrenceFrequency;
				if (formData.recurrenceType === ScheduleRepeatType.Weekly) {
					if (formData.recurrenceWeeklyDays.length === 0) {
						event.RepeatWeeklyData = '1';
					}
					event.RepeatWeeklyData = formData.recurrenceWeeklyDays.join(
						','
					) as ScheduleRepeatWeeklyData;
				}
				if (formData.recurrenceEndType === ScheduleRepeatEndType.On) {
					event.RepeatEndDay = dayjs(formData.recurrenceEndDate).format('DD');
					event.RepeatEndMonth = dayjs(formData.recurrenceEndDate).format('MM');
					event.RepeatEndYear = dayjs(formData.recurrenceEndDate).format('YYYY');
				}
				if (formData.recurrenceStartType === ScheduleRepeatStartType.Default) {
					event.RepeatStartDay = dayjs(formData.start).format('DD');
					event.RepeatStartMonth = dayjs(formData.start).format('MM');
					event.RepeatStartYear = dayjs(formData.start).format('YYYY');
				} else if (formData.recurrenceStartType === ScheduleRepeatStartType.On) {
					event.RepeatStartDay = dayjs(formData.recurrenceStartDate).format('DD');
					event.RepeatStartMonth = dayjs(formData.recurrenceStartDate).format('MM');
					event.RepeatStartYear = dayjs(formData.recurrenceStartDate).format('YYYY');
				}
			}

			const newEvent = await scheduleService.createEvent(event);
			await refetchEvents();
			closeModal();
			ui.actions.navigateToTileComplete();
			ui.actions.showSuccess(newEvent);
		} catch (error) {
			console.error(error);
			toast.error(String(error));
		} finally {
			ui.actions.endLoading();
		}
	}, [isValidSubmission, formData, ui, refetchEvents, resetForm, calendarDispatch, t, theme]);

	function viewCreatedEvent() {
		const successTile = ui.state.success.tile;
		if (!successTile || successTile.calendarEvent.id === null) return;
		calendarDispatch(
			{
				type: CalendarRequestType.FocusEvent,
				entityId: successTile.calendarEvent.id,
				entityType: CalendarEntityType.CalendarEvent,
				actionType: Actions.Add_New_Task,
			},
			(result: CalendarRequestResult) => {
				if (result.status === CalendarRequestStatus.Navigating) {
					ui.actions.navigateToTile();
				} else {
					ui.actions.navigateToTileComplete();
					ui.actions.hideSuccess();
					if (result.status === CalendarRequestStatus.NotFound) {
						console.warn(
							'[CreateTile] Calendar could not find entity:',
							successTile.calendarEvent.id
						);
					}
				}
			}
		);
	}

	useEffect(() => {
		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key === 'Enter') {
				event.preventDefault();
				// Trigger form submit
				submitForm();
			}
		};
		if (ui.state.isOpen) {
			document.addEventListener('keydown', onKeyDown);
		} else {
			document.removeEventListener('keydown', onKeyDown);
		}
		return () => {
			document.removeEventListener('keydown', onKeyDown);
		};
	}, [ui.state.isOpen, submitForm]);

	return (
		<StyledCalendarCreateEvent
			onSubmit={(e) => {
				e.preventDefault();
				submitForm();
			}}
			$isexpanded={ui.state.isExpanded}
		>
			<LoadingModal show={ui.state.loading.isActive} setShow={ui.actions.endLoading}>
				<p>
					{t('calendar.createTile.message.pending', {
						action: ui.state.loading.tileName,
					})}
				</p>
			</LoadingModal>
			<SuccessModal
				show={ui.state.success.isOpen}
				setShow={ui.actions.hideSuccess}
				closeTimeout={!ui.state.success.isNavigatingToTile ? 15 : undefined}
				actions={[
					{
						text: t('calendar.createTile.buttons.viewInTimeline'),
						onClick: viewCreatedEvent,
						disabled: ui.state.success.isNavigatingToTile,
					},
				]}
			>
				<p>
					<Trans
						i18nKey="calendar.createTile.message.success"
						components={{
							b: <b />,
							action: <>{ui.state.success.tile?.calendarEvent.name}</>,
						}}
					/>
				</p>
			</SuccessModal>
			<header>
				<div className="title">
					<h2>{t('calendar.createTile.title')}</h2>
				</div>
				<button type="button" onClick={closeModal}>
					<X size={16} color={theme.colors.text.primary} />
				</button>
			</header>

			{/* Tile Description */}
			<Section $isexpanded={ui.state.isExpanded}>
				<DescriptionContainer>
					<Trans
						i18nKey="calendar.createTile.description"
						components={{
							action: (
								<DescriptionInput
									markRequired
									value={formData.action}
									onChange={handleFormInputChange('action')}
									minWidth={50}
									maxWidth={250}
								/>
							),
							location: (
								<DescriptionInput
									value={formData.location}
									onChange={handleFormInputChange('location')}
									minWidth={50}
									maxWidth={250}
								/>
							),
							hours: (
								<DescriptionInput
									markRequired
									value={formData.durationHours}
									onChange={handleFormInputChange('durationHours', {
										restriction: 'integer',
									})}
									minWidth={50}
									maxWidth={50}
									type="number"
								/>
							),
							minutes: (
								<DescriptionInput
									markRequired
									value={formData.durationMins}
									onChange={handleFormInputChange('durationMins', {
										restriction: 'integer',
									})}
									minWidth={50}
									maxWidth={50}
									type="number"
								/>
							),
							date: (
								<DescriptionDatePickerContainer>
									<DescriptionDatePickerDisplay>
										{dayjs(formData.deadline)
											.toDate()
											.toLocaleDateString(undefined, {
												year: 'numeric',
												month: '2-digit',
												day: '2-digit',
											})}
										<Calendar color={theme.colors.text.secondary} size={20} />
									</DescriptionDatePickerDisplay>
									<DatePicker
										ghostInput
										value={dayjs(formData.deadline).format('YYYY-MM-DD')}
										minDate={dayjs().format('YYYY-MM-DD')}
										onChange={(date) =>
											handleFormInputChange('deadline', {
												mode: 'static',
											})(dayjs(date))
										}
									/>
								</DescriptionDatePickerContainer>
							),
						}}
					/>
				</DescriptionContainer>
			</Section>

			<Seperator />
			<TipContainer>
				<Keyboard size={20} />
				<p>
					<Trans
						i18nKey="calendar.createTile.tip.description"
						components={{
							b: <b />,
							key: <>{t('calendar.createTile.tip.keys.enter')}</>,
						}}
					/>
				</p>
			</TipContainer>

			{/* Tile Actions */}
			{ui.state.isExpanded && (
				<>
					<Section $isexpanded={ui.state.isExpanded}>
						<Options formHandler={formHandler} />
					</Section>
					<Spacer />
					<Summary formData={formData} />
				</>
			)}
			<ButtonContainer $isexpanded={ui.state.isExpanded}>
				<Button
					type="button"
					variant={'ghost'}
					onClick={ui.state.isExpanded ? ui.actions.collapse : ui.actions.expand}
				>
					{ui.state.isExpanded
						? t('calendar.createTile.buttons.collapse')
						: t('calendar.createTile.buttons.expand')}
				</Button>
				<Button type="button" variant={'ghost'} onClick={resetForm}>
					{t('calendar.createTile.buttons.reset')}
				</Button>
				<Button variant="brand" type="submit" disabled={!isValidSubmission}>
					{t('calendar.createTile.buttons.submit')}
				</Button>
			</ButtonContainer>
		</StyledCalendarCreateEvent>
	);
};

const Spacer = styled.div`
	flex: 1;
`;

const Seperator = styled.hr`
	border: none;
	height: 1px;
	background-color: ${(props) => props.theme.colors.border.strong};
`;

const Section = styled.section<{ $isexpanded: boolean }>`
	padding: 1rem 1.25rem;
	width: 100%;
	max-width: ${(props) => props.theme.screens.md};
	margin-inline: auto;
	border-inline: ${(props) => (props.$isexpanded ? '0px' : '1px')} solid
		${(props) => props.theme.colors.border.strong};
`;

const ButtonContainer = styled.div<{ $isexpanded: boolean }>`
	${(props) => (props.$isexpanded ? 'position: sticky; bottom: 0;' : '')}
	${(props) =>
		props.$isexpanded
			? `border-top: 1px solid ${props.theme.colors.border.strong};`
			: `border: 1px solid ${props.theme.colors.border.strong};`}
	border-radius: 0 0 ${(props) => props.theme.borderRadius.xLarge}
		${(props) => props.theme.borderRadius.xLarge};
	display: flex;
	justify-content: flex-end;
	gap: 0.25rem;
	padding: 0.5rem 1rem;
	background-color: ${(props) => props.theme.colors.background.card};
`;

export const DescriptionDatePickerContainer = styled.div`
	width: 150px;
	position: relative;
`;

export const DescriptionDatePickerDisplay = styled.div`
	position: absolute;
	inset: 0;
	background: none;
	outline: none;
	color: ${(props) => props.theme.colors.highlight.text};
	font-weight: ${(props) => props.theme.typography.fontWeight.bold};
	font-size: ${(props) => props.theme.typography.fontSize.xl};
	border-bottom: 1.5px dashed ${(props) => props.theme.colors.highlight.text} !important;
	text-align: center;
	display: flex;
	justify-content: space-around;
	align-items: center;
`;

const DescriptionInput = styled(AutosizeInput)`
	color: ${(props) => props.theme.colors.highlight.text};
	border-bottom: 1.5px dashed ${(props) => props.theme.colors.highlight.text} !important;
`;

export const DescriptionContainer = styled.div`
	box-shadow: 0 0 0 1.5px ${(props) => props.theme.colors.border};
	border-radius: ${(props) => props.theme.borderRadius.xLarge};
	padding: 1rem 1.25rem;
	font-family: ${(props) => props.theme.typography.fontFamily.urban};
	font-weight: ${(props) => props.theme.typography.fontWeight.bold};
	font-size: ${(props) => props.theme.typography.fontSize.xl};
	display: inline-flex;
	justify-content: center;
	align-items: center;
	gap: 0.5rem;
	flex-wrap: wrap;
	color: ${(props) => props.theme.colors.text.secondary};
`;

const TipContainer = styled.div`
	display: flex;
	gap: 0.5rem;
	align-items: center;
	justify-content: center;
	padding: 0.5rem 1rem;
	background-color: ${(props) => props.theme.colors.background.card2};
	color: ${(props) => props.theme.colors.text.secondary};
	font-family: ${(props) => props.theme.typography.fontFamily.urban};
	font-weight: ${(props) => props.theme.typography.fontWeight.semibold};
	font-size: ${(props) => props.theme.typography.fontSize.base};

	b {
		font-weight: ${(props) => props.theme.typography.fontWeight.bold};
		color: ${(props) => props.theme.colors.text.primary};
	}
`;

const StyledCalendarCreateEvent = styled.form<{ $isexpanded: boolean }>`
	display: flex;
	flex-direction: column;
	background-color: ${(props) => props.theme.colors.background.card};
	width: 100%;
	isolation: isolate;

	${(props) =>
		props.$isexpanded
			? `
			position: fixed;
			inset: 0;
			z-index: 1001;
			overflow-y: scroll;
			overflow-x: hidden;
		`
			: `
			border-radius: ${props.theme.borderRadius.xLarge};
		`};

	& > header {
		z-index: 1;
		width: 100%;
		position: sticky;
		top: 0;

		${(props) =>
			props.$isexpanded
				? `border-bottom: 1px solid ${props.theme.colors.border.strong};`
				: `border: 1px solid ${props.theme.colors.border.strong};`}
		background-color: ${(props) => props.theme.colors.background.card};
		display: flex;
		align-items: center;
		justify-content: flex-start;
		gap: 0.5rem;
		padding: 8px 16px;
		border-radius: ${(props) =>
			`${props.theme.borderRadius.xLarge} ${props.theme.borderRadius.xLarge} 0 0`};

		> button {
			height: 28px;
			width: 28px;
			border: 1px solid ${(props) => props.theme.colors.border.default};
			color: ${(props) => props.theme.colors.text.primary};
			border-radius: ${(props) => props.theme.borderRadius.medium};
			display: flex;
			justify-content: center;
			align-items: center;
			transition: background-color 0.2s;

			&:hover {
				background-color: ${(props) => props.theme.colors.background.card2};
			}
		}
	}

	.title {
		flex: 1;
		overflow: hidden;

		h2 {
			white-space: nowrap;
			overflow: hidden;
			text-overflow: ellipsis;
			font-size: ${(props) => props.theme.typography.fontSize.lg};
			font-family: ${(props) => props.theme.typography.fontFamily.urban};
			font-weight: ${(props) => props.theme.typography.fontWeight.bold};
			color: ${(props) => props.theme.colors.text.primary};
			line-height: 1.1;
		}
	}
`;

export default CalendarCreateTile;
