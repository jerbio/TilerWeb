import useFormHandler from '@/hooks/useFormHandler';
import styled from 'styled-components';
import dayjs from 'dayjs';
import React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import {
  ScheduleRepeatEndType,
  ScheduleRepeatFrequency,
  ScheduleRepeatStartType,
  ScheduleRepeatType,
  ScheduleRepeatWeekday,
} from '../../../types/schedule';
import { InitialCreateTileFormState } from '.';
import CreateTileColorOptions from './options.color';
import CreateTileActionsOptions from './options.actions';

type OptionsProps = {
  formHandler: ReturnType<typeof useFormHandler<InitialCreateTileFormState>>;
};

const CreateTileOptions: React.FC<OptionsProps> = ({ formHandler }) => {
  const { t } = useTranslation();
  const { formData } = formHandler;

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
            date: <>{dayjs(formData.start).format('D MMM YYYY')}</>,
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

  const tileOptions = [
    {
      title: t('calendar.createTile.sections.tileColor'),
      content: <CreateTileColorOptions formHandler={formHandler} />,
    },
    {
      title: t('calendar.createTile.sections.tileActions'),
      content: (
        <CreateTileActionsOptions
          formHandler={formHandler}
          recurrenceTypeOptions={recurrenceTypeOptions}
          recurrenceEndTypeOptions={recurrenceEndTypeOptions}
          recurrenceWeekdayOptions={recurrenceWeekdayOptions}
          recurrenceStartTypeOptions={recurrenceStartTypeOptions}
        />
      ),
    },
  ];

  return (
    <TileOptionsContainer>
      {tileOptions.map((option) => (
        <TileOption key={option.title}>
          <TileOptionHeader>{option.title}</TileOptionHeader>
          {option.content}
        </TileOption>
      ))}
    </TileOptionsContainer>
  );
};

export default CreateTileOptions;

const TileOptionHeader = styled.header`
	font-size: ${(props) => props.theme.typography.fontSize.lg};
	font-family: ${(props) => props.theme.typography.fontFamily.urban};
	font-weight: ${(props) => props.theme.typography.fontWeight.bold};
	color: ${(props) => props.theme.colors.text.primary};
	padding-block: 0.625rem;
	line-height: 1;
`;

const TileOption = styled.div`
	display: flex;
	flex-direction: column;
	margin-bottom: 1rem;
`;

const TileOptionsContainer = styled.div`
	display: flex;
	flex-direction: column;
	gap: 1rem;
`;
