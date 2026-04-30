import useFormHandler from '@/hooks/useFormHandler';
import { X } from 'lucide-react';
import styled, { useTheme as useStyledTheme } from 'styled-components';
import dayjs from 'dayjs';
import Button from '../../button';
import { RGBColor } from '@/core/util/colors';
import React, { useMemo } from 'react';
import advancedFormat from 'dayjs/plugin/advancedFormat';
import { Trans, useTranslation } from 'react-i18next';
import LoadingModal from '../../modals/loading-modal';
import SuccessModal from '../../modals/success-modal';
import {
	ScheduleBooleanString,
	ScheduleCreateEventParams,
	ScheduleRepeatEndType,
	ScheduleRepeatFrequency,
	ScheduleRepeatStartType,
	ScheduleRepeatType,
	ScheduleRepeatWeekday,
	ScheduleRepeatWeeklyData,
} from '../../../types/schedule';
import { useCalendarDispatch } from '../CalendarRequestProvider';
import { useCalendarUI } from '../calendar-ui.provider';
import {
	StyledCalendarCreateEvent,
	StyledCalendarCreateEventActions,
	viewCreatedEvent,
} from '../create_tile';
import CreateBlockInfo from './info';
import { toast } from 'sonner';
import { scheduleService } from '@/services';
import TimeUtil from '@/core/util/time';
import { MINUTES_IN_DAY } from '@/core/common/utils/timeUtils';
import CreateTileOptions, { OptionsFormController, TileOptionsMode } from '../create_tile/options';
import CreateBlockSummary from './summary';

dayjs.extend(advancedFormat);

export type InitialCreateBlockFormState = {
	name: string;
	start: dayjs.Dayjs;
	startTime: string;
	end: dayjs.Dayjs;
	endTime: string;
	location: string;
	locationId: string | null;
	locationSource: string;
	locationIsVerified: boolean;
	locationTag: string;
	color: RGBColor;
	isRecurring: boolean;
	recurrenceType: ScheduleRepeatType;
	recurrenceFrequency: ScheduleRepeatFrequency;
	recurrenceWeeklyDays: ScheduleRepeatWeekday[];
	recurrenceStartType: ScheduleRepeatStartType;
	recurrenceStartDate: dayjs.Dayjs;
	recurrenceEndType: ScheduleRepeatEndType;
	recurrenceEndDate: dayjs.Dayjs;
};

type CalendarCreateBlockProps = {
	formHandler: ReturnType<typeof useFormHandler<InitialCreateBlockFormState>>;
	refetchEvents: () => Promise<void>;
};

const CalendarCreateBlock: React.FC<CalendarCreateBlockProps> = ({
	formHandler,
	refetchEvents,
}) => {
	const { formData, resetForm, handleFormInputChange } = formHandler;
	const ui = useCalendarUI((state) => state.createBlock);
	const theme = useStyledTheme();
	const calendarDispatch = useCalendarDispatch();
	const { t } = useTranslation();

	const isValidSubmission = useMemo(() => {
		if (formData.name.trim().length === 0) return false;
		const duration = TimeUtil.minutesBetweenMeridians(
			formData.startTime,
			formData.endTime,
			formData.start,
			formData.end
		);
		if (duration <= 0) return false;
		return true;
	}, [formData]);

	const optionsController: OptionsFormController = {
		start: formData.start,
		color: formData.color,
		setColor: handleFormInputChange('color', { mode: 'static' }),
		recurring: formData.isRecurring,
		setRecurring: handleFormInputChange('isRecurring', { mode: 'static' }),
		recurrenceType: formData.recurrenceType,
		setRecurrenceType: handleFormInputChange('recurrenceType', { mode: 'static' }),
		recurrenceFrequency: formData.recurrenceFrequency,
		setRecurrenceFrequency: handleFormInputChange('recurrenceFrequency', { mode: 'static' }),
		recurrenceWeeklyDays: formData.recurrenceWeeklyDays,
		setRecurrenceWeeklyDays: handleFormInputChange('recurrenceWeeklyDays', { mode: 'static' }),
		recurrenceStartType: formData.recurrenceStartType,
		setRecurrenceStartType: handleFormInputChange('recurrenceStartType', { mode: 'static' }),
		recurrenceStartDate: formData.recurrenceStartDate,
		setRecurrenceStartDate: handleFormInputChange('recurrenceStartDate', { mode: 'static' }),
		recurrenceEndType: formData.recurrenceEndType,
		setRecurrenceEndType: handleFormInputChange('recurrenceEndType', { mode: 'static' }),
		recurrenceEndDate: formData.recurrenceEndDate,
		setRecurrenceEndDate: handleFormInputChange('recurrenceEndDate', { mode: 'static' }),
	};

	async function submitForm() {
		if (!isValidSubmission) return;
		ui.actions.startLoading(formData.name);

		try {
			const startInMinutes = TimeUtil.meridianToMinutesFromStartOfDay(formData.startTime);
			const endInMinutes = TimeUtil.meridianToMinutesFromStartOfDay(formData.endTime);
			const start = dayjs(formData.start)
				.set('hour', Math.floor(startInMinutes / 60))
				.set('minute', startInMinutes % 60);
			const end = dayjs(formData.end)
				.set('hour', Math.floor(endInMinutes / 60))
				.set('minute', endInMinutes % 60);

			// Compute duration
			const duration = end.diff(start, 'minutes');
			const durationDays = Math.floor(duration / MINUTES_IN_DAY);
			const durationHours = Math.floor((duration % MINUTES_IN_DAY) / 60);
			const durationMinutes = Math.floor(duration % 60);

			const event: ScheduleCreateEventParams = {
				Rigid: ScheduleBooleanString.True,
				Name: formData.name,
				RColor: formData.color.r.toString(),
				GColor: formData.color.g.toString(),
				BColor: formData.color.b.toString(),
				LocationAddress: formData.location,
				LookupString: formData.location || undefined,
				LocationIsVerified: formData.locationIsVerified ? 'true' : 'false',
				LocationId: formData.locationId || undefined,
				LocationSource: formData.locationSource || undefined,
				LocationTag: formData.locationTag || undefined,
				StartDay: start.format('DD'),
				StartYear: start.format('YYYY'),
				StartMonth: start.format('MM'),
				StartHour: start.hour().toString(),
				StartMinute: start.minute().toString(),
				EndDay: end.format('DD'),
				EndYear: end.format('YYYY'),
				EndMonth: end.format('MM'),
				EndHour: end.hour().toString(),
				EndMinute: end.minute().toString(),
				DurationDays: String(durationDays),
				DurationHours: String(durationHours),
				DurationMinute: String(durationMinutes),
				isRestricted: ScheduleBooleanString.False,
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
			ui.actions.navigateToBlockComplete();
			ui.actions.showSuccess(newEvent);
		} catch (error) {
			console.error(error);
			toast.error(String(error));
		} finally {
			ui.actions.endLoading();
		}
	}

	function closeModal() {
		resetForm();
		ui.actions.close();
		ui.actions.collapse();
	}

	return (
		<StyledCalendarCreateEvent
			onSubmit={(e) => {
				e.preventDefault();
				submitForm();
			}}
			$isexpanded={ui.state.isExpanded}
		>
			<button
				style={{ display: 'none' }}
				data-testid="open-create-block"
				type="button"
				onClick={ui.actions.open}
			/>
			<LoadingModal show={ui.state.loading.isActive} setShow={ui.actions.endLoading}>
				<p>
					{t('calendar.createBlock.message.pending', {
						name: ui.state.loading.blockName,
					})}
				</p>
			</LoadingModal>
			<SuccessModal
				show={ui.state.success.isOpen}
				setShow={ui.actions.hideSuccess}
				closeTimeout={!ui.state.success.isNavigatingToBlock ? 15 : undefined}
				actions={[
					{
						text: t('calendar.createBlock.buttons.viewInTimeline'),
						onClick: () => {
							viewCreatedEvent(ui.state.success.block!, calendarDispatch, {
								navigateToEvent: ui.actions.navigateToBlock,
								navigateToEventComplete: ui.actions.navigateToBlockComplete,
								hideSuccess: ui.actions.hideSuccess,
							});
						},
						disabled: ui.state.success.isNavigatingToBlock,
					},
				]}
			>
				<p>
					<Trans
						i18nKey="calendar.createBlock.message.success"
						components={{
							b: <b />,
							name: <span>{ui.state.success.block?.calendarEvent.name}</span>,
						}}
					/>
				</p>
			</SuccessModal>
			<header>
				<div className="title">
					<h2>{t('calendar.createBlock.title')}</h2>
				</div>
				<button type="button" onClick={closeModal}>
					<X size={16} color={theme.colors.text.primary} />
				</button>
			</header>

			<Section $isexpanded={ui.state.isExpanded}>
				<CreateBlockInfo formHandler={formHandler} />
			</Section>

			{/* Block Options */}
			{ui.state.isExpanded && (
				<>
					<Section $isexpanded={ui.state.isExpanded}>
						<CreateTileOptions
							mode={TileOptionsMode.Block}
							controller={optionsController}
						/>
					</Section>
					<Spacer />
					<CreateBlockSummary formData={formData} />
				</>
			)}

			<StyledCalendarCreateEventActions $isexpanded={ui.state.isExpanded}>
				<Button
					type="button"
					variant={'ghost'}
					onClick={ui.state.isExpanded ? ui.actions.collapse : ui.actions.expand}
				>
					{ui.state.isExpanded
						? t('calendar.createBlock.buttons.collapse')
						: t('calendar.createBlock.buttons.expand')}
				</Button>
				<Button type="button" variant={'ghost'} onClick={resetForm}>
					{t('calendar.createBlock.buttons.reset')}
				</Button>
				<Button variant="brand" type="submit" disabled={!isValidSubmission}>
					{t('calendar.createBlock.buttons.submit')}
				</Button>
			</StyledCalendarCreateEventActions>
		</StyledCalendarCreateEvent>
	);
};

const Spacer = styled.div`
	flex: 1;
`;

const Section = styled.section<{ $isexpanded: boolean }>`
	padding: 1rem 1.25rem;
	width: 100%;
	max-width: ${(props) => props.theme.screens.md};
	margin-inline: auto;
	border-inline: ${(props) => (props.$isexpanded ? '0px' : '1px')} solid
		${(props) => props.theme.colors.border.strong};
`;

export default CalendarCreateBlock;
