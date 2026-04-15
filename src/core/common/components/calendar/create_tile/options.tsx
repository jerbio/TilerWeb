import styled from 'styled-components';
import React from 'react';
import { useTranslation } from 'react-i18next';
import CreateTileColorOptions from './options.color';
import CreateTileActionsOptions from './options.actions';
import { RGBColor } from '@/core/util/colors';
import { CreateTileRestrictionType } from '../data';
import { DaySchedule, ScheduleRepeatEndType, ScheduleRepeatFrequency, ScheduleRepeatStartType, ScheduleRepeatType, ScheduleRepeatWeekday } from '@/core/common/types/schedule';
import dayjs from 'dayjs';

export type OptionsFormController = {
	start: dayjs.Dayjs;
	color: RGBColor;
	setColor: (color: RGBColor) => void;
	recurring: boolean;
  setRecurring: (recurring: boolean) => void;
	recurrenceType: ScheduleRepeatType;
  setRecurrenceType: (type: ScheduleRepeatType) => void;
	recurrenceFrequency: ScheduleRepeatFrequency;
  setRecurrenceFrequency: (frequency: ScheduleRepeatFrequency) => void;
  recurrenceWeeklyDays: ScheduleRepeatWeekday[];
  setRecurrenceWeeklyDays: (days: ScheduleRepeatWeekday[]) => void;
  recurrenceStartType: ScheduleRepeatStartType;
  setRecurrenceStartType: (type: ScheduleRepeatStartType) => void;
  recurrenceStartDate: dayjs.Dayjs;
  setRecurrenceStartDate: (date: dayjs.Dayjs) => void;
  recurrenceEndType: ScheduleRepeatEndType;
  setRecurrenceEndType: (type: ScheduleRepeatEndType) => void;
  recurrenceEndDate: dayjs.Dayjs;
  setRecurrenceEndDate: (date: dayjs.Dayjs) => void;
	// Restrictions only available for tiles
  timeRestricted?: boolean;
  setTimeRestricted?: (val: boolean) => void;
	timeRestrictionType?: CreateTileRestrictionType;
	setTimeRestrictionType?: (type: CreateTileRestrictionType) => void;
	customTimeRestrictionSchedule?: DaySchedule[];
  setCustomTimeRestrictionSchedule?: (schedule: DaySchedule[]) => void;
}

type OptionsProps = {
	controller: OptionsFormController;
};

const CreateTileOptions: React.FC<OptionsProps> = ({ controller }) => {
	const { t } = useTranslation();

	const tileOptions = [
		{
			title: t('calendar.createTile.sections.tileColor'),
			content: <CreateTileColorOptions controller={controller} />,
		},
		{
			title: t('calendar.createTile.sections.tileActions'),
			content: (
				<CreateTileActionsOptions
					controller={controller}
				/>
			),
		},
	];

	return (
		<TileOptionsContainer>
			{tileOptions.map((option, index) => (
				<React.Fragment key={option.title}>
					<TileOption>
						<TileOptionHeader>{option.title}</TileOptionHeader>
						{option.content}
					</TileOption>
					<Divider $visible={index !== tileOptions.length - 1} />
				</React.Fragment>
			))}
		</TileOptionsContainer>
	);
};

export default CreateTileOptions;

export const Divider = styled.hr<{ $visible: boolean }>`
	opacity: ${(props) => (props.$visible ? 1 : 0)};
	border: 1px solid ${(props) => props.theme.colors.border.strong};
`;

export const TileOptionHeader = styled.header`
	font-size: ${(props) => props.theme.typography.fontSize.lg};
	font-family: ${(props) => props.theme.typography.fontFamily.urban};
	font-weight: ${(props) => props.theme.typography.fontWeight.bold};
	color: ${(props) => props.theme.colors.text.primary};
	padding-block: 0.625rem;
	line-height: 1;
`;

export const TileOption = styled.div`
	display: flex;
	flex-direction: column;
	margin-bottom: 1rem;
`;

export const TileOptionsContainer = styled.div`
	display: flex;
	flex-direction: column;
	gap: 0.25rem;
`;
