import useFormHandler from '@/hooks/useFormHandler';
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
import {
  InlineControl,
  InlineDatePickerContainer,
  InlineDatePickerDisplay,
  InitialCreateTileFormState,
} from '.';
import Radio from '../../radio';
import { CreateTileRestrictionType } from '../data';
import { useCalendarUI } from '../calendar-ui.provider';
import WeeklySchedule, { WeeklyScheduleSize } from '../../WeeklySchedule';

type ActionsOptionsProps = {
  formHandler: ReturnType<typeof useFormHandler<InitialCreateTileFormState>>;
  recurrenceTypeOptions: {
    value: ScheduleRepeatType;
    label: string;
    frequency: ScheduleRepeatFrequency;
  }[];
  recurrenceWeekdayOptions: { value: ScheduleRepeatWeekday; label: string }[];
  recurrenceStartTypeOptions: { value: ScheduleRepeatStartType; label: JSX.Element | string }[];
  recurrenceEndTypeOptions: { value: ScheduleRepeatEndType; label: string }[];
  restrictionTypeOptions: { value: CreateTileRestrictionType; label: string }[];
};

const CreateTileActionsOptions: React.FC<ActionsOptionsProps> = ({
  formHandler: { formData, handleFormInputChange, setFormData },
  recurrenceTypeOptions,
  recurrenceWeekdayOptions,
  recurrenceStartTypeOptions,
  recurrenceEndTypeOptions,
  restrictionTypeOptions,
}) => {
  const { t } = useTranslation();
  const theme = useStyledTheme();
  const ui = useCalendarUI((state) => state.createTile);

	// If restriction profiles are loading, set the restriction type to Anytime
  useEffect(() => {
    if (ui.state.restrictionProfile.loading) {
      handleFormInputChange('timeRestrictionType', {
        mode: 'static',
      })(CreateTileRestrictionType.Anytime);
    }
  }, [ui.state.restrictionProfile.loading]);

  const handleCustomRestrictionScheduleChange = useCallback(
    (dayIndex: number, field: 'startTime' | 'endTime', value: string) => {
      setFormData((prev) => ({
        ...prev,
        customTimeRestrictionSchedule: prev.customTimeRestrictionSchedule.map((day) =>
          day.dayIndex === dayIndex ? { ...day, [field]: value } : day
        ),
      }));
    },
    []
  );

  const handleCustomRestrictionDayToggle = useCallback(
    (dayIndex: number, selected: boolean) => {
      setFormData((prev) => ({
        ...prev,
        customTimeRestrictionSchedule: prev.customTimeRestrictionSchedule.map((day) =>
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
        ),
      }));
    },
    [t]
  );

  return (
    <StyledActionsOptions>
      <Toggle
        label={t('calendar.createTile.actions.repeatTile')}
        isOn={formData.isRecurring}
        onChange={handleFormInputChange('isRecurring', { mode: 'static' })}
        containerStyle={{ paddingBlock: '.5rem', borderBottom: 'none' }}
      />
      {formData.isRecurring && (
        <TileActionContainer>
          {/* Recurrence Type Selection */}
          <RecurrenceOptions>
            {recurrenceTypeOptions.map((option) => (
              <Radio
                key={option.value}
                label={option.label}
                checked={option.value === formData.recurrenceType}
                disabled={false}
                name="recurrenceType"
                onChange={(checked) => {
                  if (checked) {
                    handleFormInputChange('recurrenceType', {
                      mode: 'static',
                    })(option.value);
                    handleFormInputChange('recurrenceFrequency', {
                      mode: 'static',
                    })(option.frequency);
                  }
                }}
              />
            ))}
          </RecurrenceOptions>
          {/* Recurrence Weekly Days Selection */}
          {formData.recurrenceType === ScheduleRepeatType.Weekly && (
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
                        formData.recurrenceWeeklyDays.includes(
                          option.value
                        );
                      const allowUnselect =
                        formData.recurrenceWeeklyDays.length > 1;
                      if (isSelected && allowUnselect) {
                        handleFormInputChange('recurrenceWeeklyDays', {
                          mode: 'static',
                        })(
                          formData.recurrenceWeeklyDays.filter(
                            (day) => day !== option.value
                          )
                        );
                      }
                      if (!isSelected) {
                        handleFormInputChange('recurrenceWeeklyDays', {
                          mode: 'static',
                        })(
                          formData.recurrenceWeeklyDays.concat(
                            option.value
                          )
                        );
                      }
                    }}
                    $selected={formData.recurrenceWeeklyDays.includes(
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
                checked={option.value === formData.recurrenceStartType}
                disabled={false}
                name="recurrenceStartType"
                onChange={(checked) => {
                  if (checked) {
                    handleFormInputChange('recurrenceStartType', {
                      mode: 'static',
                    })(option.value);
                  }
                }}
              />
            ))}
          </RecurrenceEndTypeOptions>
          {formData.recurrenceStartType === ScheduleRepeatStartType.On && (
            <InlineControl
              style={{ border: `1px solid ${theme.colors.border.default}` }}
            >
              <Trans
                i18nKey="calendar.createTile.sections.recurrenceStartDate.description"
                components={{
                  date: (
                    <InlineDatePickerContainer>
                      <InlineDatePickerDisplay>
                        {dayjs(formData.recurrenceStartDate)
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
                        value={dayjs(formData.recurrenceStartDate).format(
                          'YYYY-MM-DD'
                        )}
                        onChange={(date) =>
                          handleFormInputChange('recurrenceStartDate', {
                            mode: 'static',
                          })(dayjs(date))
                        }
                        maxDate={
                          formData.recurrenceEndType ===
                            ScheduleRepeatEndType.On
                            ? dayjs(formData.recurrenceEndDate).format(
                              'YYYY-MM-DD'
                            )
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
                checked={option.value === formData.recurrenceEndType}
                disabled={false}
                name="recurrenceEndType"
                onChange={(checked) => {
                  if (checked) {
                    handleFormInputChange('recurrenceEndType', {
                      mode: 'static',
                    })(option.value);
                  }
                }}
              />
            ))}
          </RecurrenceEndTypeOptions>
          {formData.recurrenceEndType === ScheduleRepeatEndType.On && (
            <InlineControl
              style={{ border: `1px solid ${theme.colors.border.default}` }}
            >
              <Trans
                i18nKey="calendar.createTile.sections.recurrenceEndDate.description"
                components={{
                  date: (
                    <InlineDatePickerContainer>
                      <InlineDatePickerDisplay>
                        {dayjs(formData.recurrenceEndDate)
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
                        value={dayjs(formData.recurrenceEndDate).format(
                          'YYYY-MM-DD'
                        )}
                        onChange={(date) =>
                          handleFormInputChange('recurrenceEndDate', {
                            mode: 'static',
                          })(dayjs(date))
                        }
                        minDate={dayjs(
                          formData.recurrenceStartType ===
                            ScheduleRepeatStartType.On
                            ? formData.recurrenceStartDate
                            : formData.start
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
      <Toggle
        label={t('calendar.createTile.actions.timeRestriction')}
        isOn={formData.isTimeRestricted}
        onChange={handleFormInputChange('isTimeRestricted', { mode: 'static' })}
        containerStyle={{ paddingBlock: '.5rem', borderBottom: 'none' }}
      />
      {formData.isTimeRestricted && (
        <TileActionContainer>
          {/* Restriction Type Selection */}
          <RestrictionOptions>
            {restrictionTypeOptions.map((option) => (
              <Radio
                key={option.value}
                label={option.label}
                checked={option.value === formData.timeRestrictionType}
                disabled={
                  option.value === CreateTileRestrictionType.WorkHours
                    ? !ui.state.restrictionProfile.work
                    : option.value === CreateTileRestrictionType.PersonalHours
                      ? !ui.state.restrictionProfile.personal
                      : false
                }
                name="timeRestrictionType"
                onChange={(checked) => {
                  if (checked) {
                    handleFormInputChange('timeRestrictionType', {
                      mode: 'static',
                    })(option.value);
                  }
                }}
              />
            ))}
          </RestrictionOptions>
          {/* Custom Restriction Selection */}
          {formData.timeRestrictionType === CreateTileRestrictionType.Custom && (
            <WeeklySchedule
              schedule={formData.customTimeRestrictionSchedule}
              onChange={handleCustomRestrictionScheduleChange}
              onDayToggle={handleCustomRestrictionDayToggle}
              disabled={false}
              size={WeeklyScheduleSize.Sm}
            />
          )}
        </TileActionContainer>
      )}
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
