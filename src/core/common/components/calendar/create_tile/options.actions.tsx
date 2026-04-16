import { Calendar } from 'lucide-react';
import styled, { useTheme as useStyledTheme } from 'styled-components';
import dayjs from 'dayjs';
import React, { useCallback, useEffect } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import {
	ScheduleRepeatEndType,
	ScheduleRepeatFrequency,
	ScheduleRepeatStartType,
	ScheduleRepeatType,
	ScheduleRepeatWeekday,
} from '../../../types/schedule';
import DatePicker from '../../date_picker';
import Toggle from '../../Toggle';
import { InlineControl, InlineDatePickerContainer, InlineDatePickerDisplay } from '.';
import Radio from '../../radio';
import { CreateTileRestrictionType } from '../data';
import { useCalendarUI } from '../calendar-ui.provider';
import WeeklySchedule, { WeeklyScheduleSize } from '../../WeeklySchedule';
import { OptionsFormController, TileOptionsMode } from './options';

type ActionsOptionsProps = {
	mode?: TileOptionsMode;
	controller: OptionsFormController;
};

const CreateTileActionsOptions: React.FC<ActionsOptionsProps> = ({
	controller,
	mode = TileOptionsMode.Tile,
}) => {
	const { t } = useTranslation();
	const theme = useStyledTheme();
	const ui = useCalendarUI((state) => state.createTile);

	const recurrenceTypeOptions = [
		{
			label: t('calendar.createTile.sections.recurrenceType.daily'),
			value: ScheduleRepeatType.Daily,
			frequency: ScheduleRepeatFrequency.Daily,
		},
		{
			label: t('calendar.createTile.sections.recurrenceType.weekly'),
			value: ScheduleRepeatType.Weekly,
			frequency: ScheduleRepeatFrequency.Weekly,
		},
		{
			label: t('calendar.createTile.sections.recurrenceType.monthly'),
			value: ScheduleRepeatType.Monthly,
			frequency: ScheduleRepeatFrequency.Monthly,
		},
		{
			label: t('calendar.createTile.sections.recurrenceType.yearly'),
			value: ScheduleRepeatType.Yearly,
			frequency: ScheduleRepeatFrequency.Yearly,
		},
	];

	const recurrenceWeekdayOptions = [
		{
			label: t('calendar.createTile.sections.recurrenceWeeklyDays.sunday'),
			value: ScheduleRepeatWeekday.Sunday,
		},
		{
			label: t('calendar.createTile.sections.recurrenceWeeklyDays.monday'),
			value: ScheduleRepeatWeekday.Monday,
		},
		{
			label: t('calendar.createTile.sections.recurrenceWeeklyDays.tuesday'),
			value: ScheduleRepeatWeekday.Tuesday,
		},
		{
			label: t('calendar.createTile.sections.recurrenceWeeklyDays.wednesday'),
			value: ScheduleRepeatWeekday.Wednesday,
		},
		{
			label: t('calendar.createTile.sections.recurrenceWeeklyDays.thursday'),
			value: ScheduleRepeatWeekday.Thursday,
		},
		{
			label: t('calendar.createTile.sections.recurrenceWeeklyDays.friday'),
			value: ScheduleRepeatWeekday.Friday,
		},
		{
			label: t('calendar.createTile.sections.recurrenceWeeklyDays.saturday'),
			value: ScheduleRepeatWeekday.Saturday,
		},
	];

	const recurrenceStartTypeOptions = [
		{
			label: (
				<Trans
					i18nKey="calendar.createTile.sections.recurrenceStartType.default"
					components={{
						date: <>{dayjs(controller.start).format('D MMM YYYY')}</>,
					}}
				/>
			),
			value: ScheduleRepeatStartType.Default,
		},
		{
			label: t('calendar.createTile.sections.recurrenceStartType.on'),
			value: ScheduleRepeatStartType.On,
		},
	];

	const recurrenceEndTypeOptions = [
		{
			label: t('calendar.createTile.sections.recurrenceEndType.never'),
			value: ScheduleRepeatEndType.Never,
		},
		{
			label: t('calendar.createTile.sections.recurrenceEndType.on'),
			value: ScheduleRepeatEndType.On,
		},
	];

	const restrictionTypeOptions = [
		{
			label: t('calendar.createTile.sections.restrictionType.anytime'),
			value: CreateTileRestrictionType.Anytime,
		},
		{
			label: t('calendar.createTile.sections.restrictionType.work'),
			value: CreateTileRestrictionType.WorkHours,
		},
		{
			label: t('calendar.createTile.sections.restrictionType.personal'),
			value: CreateTileRestrictionType.PersonalHours,
		},
		{
			label: t('calendar.createTile.sections.restrictionType.custom'),
			value: CreateTileRestrictionType.Custom,
		},
	];

	// If restriction profiles are loading, set the restriction type to Anytime
	useEffect(() => {
		if (controller.setTimeRestrictionType && ui.state.restrictionProfile.loading) {
			controller.setTimeRestrictionType(CreateTileRestrictionType.Anytime);
		}
	}, [ui.state.restrictionProfile.loading]);

	const handleCustomRestrictionScheduleChange = useCallback(
		(dayIndex: number, field: 'startTime' | 'endTime', value: string) => {
			if (!controller.customTimeRestrictionSchedule) return;
			if (!controller.setCustomTimeRestrictionSchedule) return;
			controller.setCustomTimeRestrictionSchedule(
				controller.customTimeRestrictionSchedule.map((day) =>
					day.dayIndex === dayIndex ? { ...day, [field]: value } : day
				)
			);
		},
		[]
	);

	const handleCustomRestrictionDayToggle = useCallback(
		(dayIndex: number, selected: boolean) => {
			if (!controller.customTimeRestrictionSchedule) return;
			if (!controller.setCustomTimeRestrictionSchedule) return;
			controller.setCustomTimeRestrictionSchedule(
				controller.customTimeRestrictionSchedule.map((day) =>
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
		<StyledActionsOptions>
			<Toggle
				label={
					mode === TileOptionsMode.Tile
						? t('calendar.createBlock.actions.repeatTile')
						: t('calendar.createBlock.actions.repeatBlock')
				}
				isOn={controller.recurring}
				onChange={controller.setRecurring}
				containerStyle={{ paddingBlock: '.5rem', borderBottom: 'none' }}
			/>
			{controller.recurring && (
				<TileActionContainer>
					{/* Recurrence Type Selection */}
					<RecurrenceOptions>
						{recurrenceTypeOptions.map((option) => (
							<Radio
								key={option.value}
								label={option.label}
								checked={option.value === controller.recurrenceType}
								disabled={false}
								name="recurrenceType"
								onChange={(checked) => {
									if (checked) {
										controller.setRecurrenceType(option.value);
										controller.setRecurrenceFrequency(option.frequency);
									}
								}}
							/>
						))}
					</RecurrenceOptions>
					{/* Recurrence Weekly Days Selection */}
					{controller.recurrenceType === ScheduleRepeatType.Weekly && (
						<>
							<TileActionHeader>
								{t('calendar.createTile.sections.recurrenceWeeklyDays.title')}
							</TileActionHeader>
							<RecurrenceWeekdayOptions>
								{recurrenceWeekdayOptions.map((option) => (
									<RecurrenceWeekdayOption
										type="button"
										name={option.label}
										title={option.label}
										key={option.value}
										onClick={() => {
											const isSelected =
												controller.recurrenceWeeklyDays.includes(
													option.value
												);
											const allowUnselect =
												controller.recurrenceWeeklyDays.length > 1;
											if (isSelected && allowUnselect) {
												controller.setRecurrenceWeeklyDays(
													controller.recurrenceWeeklyDays.filter(
														(day) => day !== option.value
													)
												);
											}
											if (!isSelected) {
												controller.setRecurrenceWeeklyDays(
													controller.recurrenceWeeklyDays.concat(
														option.value
													)
												);
											}
										}}
										$selected={controller.recurrenceWeeklyDays.includes(
											option.value
										)}
									>
										{option.label[0]}
									</RecurrenceWeekdayOption>
								))}
							</RecurrenceWeekdayOptions>
						</>
					)}
					{/* Recurrence Start Date Selection */}
					<TileActionHeader>
						{t('calendar.createTile.sections.recurrenceStartType.title')}
					</TileActionHeader>
					<RecurrenceEndTypeOptions>
						{recurrenceStartTypeOptions.map((option) => (
							<Radio
								key={option.value}
								label={option.label}
								checked={option.value === controller.recurrenceStartType}
								disabled={false}
								name="recurrenceStartType"
								onChange={(checked) => {
									if (checked) {
										controller.setRecurrenceStartType(option.value);
									}
								}}
							/>
						))}
					</RecurrenceEndTypeOptions>
					{controller.recurrenceStartType === ScheduleRepeatStartType.On && (
						<InlineControl
							style={{ border: `1px solid ${theme.colors.border.default}` }}
						>
							<Trans
								i18nKey="calendar.createTile.sections.recurrenceStartDate.description"
								components={{
									date: (
										<InlineDatePickerContainer>
											<InlineDatePickerDisplay>
												{dayjs(controller.recurrenceStartDate)
													.toDate()
													.toLocaleDateString(undefined, {
														year: 'numeric',
														month: '2-digit',
														day: '2-digit',
													})}
												<Calendar
													color={theme.colors.text.secondary}
													size={20}
												/>
											</InlineDatePickerDisplay>
											<DatePicker
												ghostInput
												value={dayjs(controller.recurrenceStartDate).format(
													'YYYY-MM-DD'
												)}
												onChange={(date) =>
													controller.setRecurrenceStartDate(dayjs(date))
												}
												maxDate={
													controller.recurrenceEndType ===
													ScheduleRepeatEndType.On
														? dayjs(
																controller.recurrenceEndDate
															).format('YYYY-MM-DD')
														: undefined
												}
											/>
										</InlineDatePickerContainer>
									),
								}}
							/>
						</InlineControl>
					)}
					{/* Recurrence End Date Selection */}
					<TileActionHeader>
						{t('calendar.createTile.sections.recurrenceEndType.title')}
					</TileActionHeader>
					<RecurrenceEndTypeOptions>
						{recurrenceEndTypeOptions.map((option) => (
							<Radio
								key={option.value}
								label={option.label}
								checked={option.value === controller.recurrenceEndType}
								disabled={false}
								name="recurrenceEndType"
								onChange={(checked) => {
									if (checked) {
										controller.setRecurrenceEndType(option.value);
									}
								}}
							/>
						))}
					</RecurrenceEndTypeOptions>
					{controller.recurrenceEndType === ScheduleRepeatEndType.On && (
						<InlineControl
							style={{ border: `1px solid ${theme.colors.border.default}` }}
						>
							<Trans
								i18nKey="calendar.createTile.sections.recurrenceEndDate.description"
								components={{
									date: (
										<InlineDatePickerContainer>
											<InlineDatePickerDisplay>
												{dayjs(controller.recurrenceEndDate)
													.toDate()
													.toLocaleDateString(undefined, {
														year: 'numeric',
														month: '2-digit',
														day: '2-digit',
													})}
												<Calendar
													color={theme.colors.text.secondary}
													size={20}
												/>
											</InlineDatePickerDisplay>
											<DatePicker
												ghostInput
												value={dayjs(controller.recurrenceEndDate).format(
													'YYYY-MM-DD'
												)}
												onChange={(date) =>
													controller.setRecurrenceEndDate(dayjs(date))
												}
												minDate={dayjs(
													controller.recurrenceStartType ===
														ScheduleRepeatStartType.On
														? controller.recurrenceStartDate
														: controller.start
												).format('YYYY-MM-DD')}
											/>
										</InlineDatePickerContainer>
									),
								}}
							/>
						</InlineControl>
					)}
				</TileActionContainer>
			)}
			{/* Time Restriction */}
			{controller.timeRestricted !== undefined &&
			controller.setTimeRestricted &&
			controller.timeRestrictionType &&
			controller.setTimeRestrictionType &&
			controller.customTimeRestrictionSchedule &&
			controller.setCustomTimeRestrictionSchedule ? (
				<>
					<Toggle
						label={t('calendar.createTile.actions.timeRestriction')}
						isOn={controller.timeRestricted}
						onChange={controller.setTimeRestricted}
						containerStyle={{ paddingBlock: '.5rem', borderBottom: 'none' }}
					/>
					{controller.timeRestricted && (
						<TileActionContainer>
							{/* Restriction Type Selection */}
							<RestrictionOptions>
								{restrictionTypeOptions.map((option) => (
									<Radio
										key={option.value}
										label={option.label}
										checked={option.value === controller.timeRestrictionType}
										disabled={
											option.value === CreateTileRestrictionType.WorkHours
												? !ui.state.restrictionProfile.work
												: option.value ===
													  CreateTileRestrictionType.PersonalHours
													? !ui.state.restrictionProfile.personal
													: false
										}
										name="timeRestrictionType"
										onChange={(checked) => {
											if (checked) {
												controller.setTimeRestrictionType?.(option.value);
											}
										}}
									/>
								))}
							</RestrictionOptions>
							{/* Custom Restriction Selection */}
							{controller.timeRestrictionType ===
								CreateTileRestrictionType.Custom && (
								<WeeklySchedule
									schedule={controller.customTimeRestrictionSchedule}
									onChange={handleCustomRestrictionScheduleChange}
									onDayToggle={handleCustomRestrictionDayToggle}
									disabled={false}
									size={WeeklyScheduleSize.Sm}
								/>
							)}
						</TileActionContainer>
					)}
				</>
			) : null}
		</StyledActionsOptions>
	);
};

export default CreateTileActionsOptions;

const StyledActionsOptions = styled.div`
	display: flex;
	flex-direction: column;

	label {
		font-family: ${(props) => props.theme.typography.fontFamily.urban};
		font-weight: ${(props) => props.theme.typography.fontWeight.semibold};
		color: ${(props) => props.theme.colors.text.primary};
	}
`;

const TileActionHeader = styled.header`
	font-family: ${(props) => props.theme.typography.fontFamily.urban};
	font-weight: ${(props) => props.theme.typography.fontWeight.semibold};
	font-size: ${(props) => props.theme.typography.fontSize.base};
	color: ${(props) => props.theme.colors.text.secondary};
	line-height: 1;
`;

const TileActionContainer = styled.div`
	display: flex;
	flex-direction: column;
	gap: 1rem;
	padding: 0.25rem;
	margin-left: 1rem;

	label {
		color: ${(props) => props.theme.colors.text.secondary} !important;
	}
`;

const RecurrenceEndTypeOptions = styled.div`
	display: flex;
	gap: 1rem;
`;

const RecurrenceWeekdayOption = styled.button<{ $selected: boolean }>`
	height: 2rem;
	width: 2rem;
	aspect-ratio: 1 / 1;
	border-radius: 50%;
	font-family: ${(props) => props.theme.typography.fontFamily.urban};
	font-weight: ${(props) => props.theme.typography.fontWeight.bold};
	background-color: ${(props) =>
		props.$selected
			? props.theme.colors.datepicker.dateSelectedBg
			: props.theme.colors.datepicker.dateHoverBg};
	color: ${(props) =>
		props.$selected
			? props.theme.colors.datepicker.dateSelectedText
			: props.theme.colors.text.secondary};
	transition: all 0.2s ease-in-out;
	outline-offset: 4px;
	outline: 2px solid transparent;
	display: flex;
	align-items: center;
	justify-content: center;
`;

const RecurrenceWeekdayOptions = styled.div`
	display: flex;
	gap: 0.75rem;
`;

const RestrictionOptions = styled.div`
	display: flex;
	flex-wrap: wrap;
	gap: 1.5rem;
`;

const RecurrenceOptions = styled.div`
	display: flex;
	flex-wrap: wrap;
	gap: 1.5rem;
`;
