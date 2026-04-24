import useFormHandler from '@/hooks/useFormHandler';
import { Keyboard, X } from 'lucide-react';
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
import { scheduleService, userService } from '@/services';
import {
	DaySchedule,
	ScheduleBooleanString,
	ScheduleCreateEventParams,
	ScheduleCreateEventResponse,
	ScheduleRepeatEndType,
	ScheduleRepeatFrequency,
	ScheduleRepeatStartType,
	ScheduleRepeatType,
	ScheduleRepeatWeekday,
	ScheduleRepeatWeeklyData,
} from '../../../types/schedule';
import { toast } from 'sonner';
import { useCalendarDispatch } from '../CalendarRequestProvider';
import {
	CalendarEntityType,
	CalendarRequestResult,
	CalendarRequestStatus,
	CalendarRequestType,
} from '../calendarRequestContext';
import { Actions } from '@/core/constants/enums';
import { useCalendarUI } from '../calendar-ui.provider';
import CreateTileSummary from './summary';
import CreateTileOptions from './options';
import CreateTileInfoInline from './info_inline';
import CreateTileInfo from './info';
import { CreateTileRestrictionType } from '../data';

dayjs.extend(advancedFormat);

export function viewCreatedEvent(
	event: ScheduleCreateEventResponse['Content'],
	calendarDispatch: ReturnType<typeof useCalendarDispatch>,
	actions: {
		navigateToEvent: () => void;
		navigateToEventComplete: () => void;
		hideSuccess: () => void;
	}
) {
	if (!event || event.calendarEvent.id === null) return;
	calendarDispatch(
		{
			type: CalendarRequestType.FocusEvent,
			entityId: event.calendarEvent.id,
			entityType: CalendarEntityType.CalendarEvent,
			actionType: Actions.Add_New_Task,
		},
		(result: CalendarRequestResult) => {
			if (result.status === CalendarRequestStatus.Navigating) {
				actions.navigateToEvent();
			} else {
				actions.navigateToEventComplete();
				actions.hideSuccess();
				if (result.status === CalendarRequestStatus.NotFound) {
					console.warn(
						'[CreateTile] Calendar could not find entity:',
						event.calendarEvent.id
					);
				}
			}
		}
	);
}

export type InitialCreateTileFormState = {
	start: dayjs.Dayjs;
	action: string;
	count: string;
	location: string;
	locationId: string | null;
	locationSource: string;
	locationIsVerified: boolean;
	locationTag: string;
	hasLocationNickname: boolean;
	locationNickname: string;
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
	timeRestrictionType: CreateTileRestrictionType;
	customTimeRestrictionSchedule: DaySchedule[];
	timeRestrictionStart: string;
	timeRestrictionEnd: string;
};

type CalendarCreateTileProps = {
	formHandler: ReturnType<typeof useFormHandler<InitialCreateTileFormState>>;
	refetchEvents: () => Promise<void>;
};

const CalendarCreateTile: React.FC<CalendarCreateTileProps> = ({ formHandler, refetchEvents }) => {
	const ui = useCalendarUI((state) => state.createTile);
	const { formData, resetForm } = formHandler;
	const theme = useStyledTheme();
	const { t } = useTranslation();
	const calendarDispatch = useCalendarDispatch();

	const isValidSubmission = useMemo(() => {
		if (formData.action.trim().length === 0) return false;
		const duration = formData.durationHours * 60 + formData.durationMins;
		if (duration === 0) return false;
		return true;
	}, [formData]);

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
				Count: formData.count,
				DurationDays: '0',
				DurationHours: formData.durationHours.toString(),
				DurationMinute: formData.durationMins.toString(),
				isRestricted: ScheduleBooleanString.False,
				MobileApp: true,
			};

			// Time Ranges
			if (!formData.isRecurring) {
				const windowStart = formData.start.startOf('day');
				const windowEnd = formData.deadline.endOf('day');
				event.StartYear = dayjs(windowStart).format('YYYY');
				event.StartMonth = dayjs(windowStart).format('MM');
				event.StartDay = dayjs(windowStart).format('DD');
				event.StartHour = dayjs(windowStart).format('HH');
				event.StartMinute = dayjs(windowStart).format('mm');
				event.EndYear = dayjs(windowEnd).format('YYYY');
				event.EndMonth = dayjs(windowEnd).format('MM');
				event.EndDay = dayjs(windowEnd).format('DD');
				event.EndHour = dayjs(windowEnd).format('HH');
				event.EndMinute = dayjs(windowEnd).format('mm');
			}

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

			// Restriction
			if (formData.isTimeRestricted) {
				event.isRestricted = ScheduleBooleanString.True;
				event.Rigid = ScheduleBooleanString.False;
				if (formData.timeRestrictionType === CreateTileRestrictionType.Anytime) {
					event.isRestricted = ScheduleBooleanString.False;
				} else if (formData.timeRestrictionType === CreateTileRestrictionType.WorkHours) {
					if (!ui.state.restrictionProfile.work?.id)
						throw new Error(t('calendar.createTile.errors.workProfileNotFound'));
					event.RestrictionProfileId = ui.state.restrictionProfile.work.id;
				} else if (
					formData.timeRestrictionType === CreateTileRestrictionType.PersonalHours
				) {
					if (!ui.state.restrictionProfile.personal?.id)
						throw new Error(t('calendar.createTile.errors.personalProfileNotFound'));
					event.RestrictionProfileId = ui.state.restrictionProfile.personal.id;
				} else {
					event.RestrictiveWeek = {
						isEnabled: ScheduleBooleanString.True,
						WeekDayOption: formData.customTimeRestrictionSchedule.map((day) => ({
							Start: day.startTime,
							End: day.endTime,
							Index: day.dayIndex.toString(),
						})),
					};
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

	async function getUserRestrictionProfiles() {
		try {
			ui.actions.loadRestrictionProfiles();
			const scheduleProfile = await userService.getScheduleProfile();
			const { workHoursRestrictionProfile: work, personalHoursRestrictionProfile: personal } =
				scheduleProfile;
			ui.actions.loadRestrictionProfilesComplete(work, personal);
		} catch (error) {
			console.error('Failed to get schedule profile:', error);
			toast.error(t('calendar.createTile.errors.scheduleProfile'));
		}
	}

	useEffect(() => {
		if (ui.state.isExpanded) {
			getUserRestrictionProfiles();
		}
	}, [ui.state.isExpanded]);

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
			<button
				style={{ display: 'none' }}
				data-testid="open-create-tile"
				type="button"
				onClick={ui.actions.open}
			/>
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
						onClick: () => {
							viewCreatedEvent(ui.state.success.tile!, calendarDispatch, {
								navigateToEvent: ui.actions.navigateToTile,
								navigateToEventComplete: ui.actions.navigateToTileComplete,
								hideSuccess: ui.actions.hideSuccess,
							});
						},
						disabled: ui.state.success.isNavigatingToTile,
					},
				]}
			>
				<p>
					<Trans
						i18nKey="calendar.createTile.message.success"
						components={{
							b: <b />,
							action: <span>{ui.state.success.tile?.calendarEvent.name}</span>,
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

			{ui.state.isExpanded ? (
				/* Tile Info (Classic) */
				<Section $isexpanded={ui.state.isExpanded}>
					<CreateTileInfo formHandler={formHandler} />
				</Section>
			) : (
				/* Tile Info (Inline) */
				<Section $isexpanded={ui.state.isExpanded}>
					<CreateTileInfoInline formHandler={formHandler} />
				</Section>
			)}

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
						<CreateTileOptions formHandler={formHandler} />
					</Section>
					<Spacer />
					<CreateTileSummary formData={formData} />
				</>
			)}
			<StyledCalendarCreateEventActions $isexpanded={ui.state.isExpanded}>
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
			</StyledCalendarCreateEventActions>
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

// -- INLINE FIELDS --
export const InlineDatePickerContainer = styled.div`
	width: 150px;
	position: relative;
`;

export const InlineDatePickerDisplay = styled.div`
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

export const InlineInput = styled(AutosizeInput)`
	color: ${(props) => props.theme.colors.highlight.text};
	border-bottom: 1.5px dashed ${(props) => props.theme.colors.highlight.text} !important;
`;

export const InlineControl = styled.div`
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

export const StyledCalendarCreateEventActions = styled.div<{ $isexpanded: boolean }>`
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

export const StyledCalendarCreateEvent = styled.form<{ $isexpanded: boolean }>`
	display: flex;
	flex-direction: column;
	background-color: ${(props) => props.theme.colors.background.card};
	width: 100%;
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
