import useFormHandler from '@/hooks/useFormHandler';
import { Calendar, Keyboard, X } from 'lucide-react';
import styled, { useTheme as useStyledTheme } from 'styled-components';
import dayjs from 'dayjs';
import Button from '../button';
import { RGB, RGBColor } from '@/core/util/colors';
import React, { useEffect, useMemo } from 'react';
import AutosizeInput from '../auto-size-input';
import advancedFormat from 'dayjs/plugin/advancedFormat';
import { Trans, useTranslation } from 'react-i18next';
import LoadingModal from '../modals/loading-modal';
import SuccessModal from '../modals/success-modal';
import { scheduleService } from '@/services';
import {
  ScheduleCreateEventParams,
  ScheduleRepeatFrequency,
  ScheduleRepeatType,
  ScheduleRepeatWeekday,
  ScheduleRepeatWeeklyData,
} from '../../types/schedule';
import { toast } from 'sonner';
import DatePicker from '../date_picker';
import { useCalendarDispatch } from './CalendarRequestProvider';
import {
  CalendarEntityType,
  CalendarRequestResult,
  CalendarRequestStatus,
  CalendarRequestType,
} from './calendarRequestContext';
import { Actions } from '@/core/constants/enums';
import { useTheme } from '@/core/theme/ThemeProvider';
import { useCalendarUI } from './calendar-ui.provider';
import Toggle from '../Toggle';
import Radio from '../radio';

dayjs.extend(advancedFormat);

export type InitialCreateTileFormState = {
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
  hasRecurrenceEndDate: boolean;
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
  tileColorOptions: RGB[];
  refetchEvents: () => Promise<void>;
};

const CalendarCreateTile: React.FC<CalendarCreateTileProps> = ({
  tileColorOptions,
  formHandler,
  refetchEvents,
}) => {
  const ui = useCalendarUI((state) => state.createTile);
  const { formData, handleFormInputChange, resetForm } = formHandler;
  const { isDarkMode } = useTheme();
  const theme = useStyledTheme();
  const { t } = useTranslation();

  const isValidSubmission = useMemo(() => {
    if (formData.action.trim().length === 0) return false;
    const duration = formData.durationHours * 60 + formData.durationMins;
    if (duration === 0) return false;
    return true;
  }, [formData]);
  const calendarDispatch = useCalendarDispatch();

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

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Enter') {
        event.preventDefault();
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

  const tileOptions = [
    {
      title: t('calendar.createTile.sections.tileColor'),
      content: (
        <TileColorOptions>
          {tileColorOptions.map((color) => {
            const optionRGBColor = new RGBColor(color);
            return (
              <TileColorOption
                key={optionRGBColor.toHex()}
                $color={optionRGBColor}
                $selected={optionRGBColor.equals(formData.color)}
                onClick={() => {
                  handleFormInputChange('color', { mode: 'static' })(
                    optionRGBColor
                  );
                }}
              ></TileColorOption>
            );
          })}
        </TileColorOptions>
      ),
    },
    {
      title: t('calendar.createTile.sections.tileActions'),
      content: (
        <TileActionToggleContainer>
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
                  <RecurrenceWeekdayOptionsHeader>
                    {t(
                      'calendar.createTile.sections.recurrenceWeeklyDays.title'
                    )}
                  </RecurrenceWeekdayOptionsHeader>
                  <RecurrenceWeekdayOptions>
                    {recurrenceWeekdayOptions.map((option) => (
                      <RecurrenceWeekdayOption
												type='button'
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
                            handleFormInputChange(
                              'recurrenceWeeklyDays',
                              {
                                mode: 'static',
                              }
                            )(
                              formData.recurrenceWeeklyDays.filter(
                                (day) => day !== option.value
                              )
                            );
                          }
                          if (!isSelected) {
                            handleFormInputChange(
                              'recurrenceWeeklyDays',
                              {
                                mode: 'static',
                              }
                            )(
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
              {/* Recurrence End Date Selection */}
              <Toggle
                label={t('calendar.createTile.sections.recurrenceEndDate.title')}
                isOn={formData.hasRecurrenceEndDate}
                onChange={handleFormInputChange('hasRecurrenceEndDate', {
                  mode: 'static',
                })}
                containerStyle={{ paddingBlock: '0rem', borderBottom: 'none' }}
              />
              {formData.hasRecurrenceEndDate && (
                <DescriptionContainer
                  style={{ border: `1px solid ${theme.colors.border.default}` }}
                >
                  <Trans
                    i18nKey="calendar.createTile.sections.recurrenceEndDate.description"
                    components={{
                      date: (
                        <DescriptionDatePickerContainer>
                          <DescriptionDatePickerDisplay>
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
                          </DescriptionDatePickerDisplay>
                          <DatePicker
                            ghostInput
                            value={dayjs(
                              formData.recurrenceEndDate
                            ).format('YYYY-MM-DD')}
                            onChange={(date) =>
                              handleFormInputChange(
                                'recurrenceEndDate',
                                {
                                  mode: 'static',
                                }
                              )(dayjs(date))
                            }
                          />
                        </DescriptionDatePickerContainer>
                      ),
                    }}
                  />
                </DescriptionContainer>
              )}
            </TileActionContainer>
          )}
        </TileActionToggleContainer>
      ),
    },
  ];

  function closeModal() {
    resetForm();
    ui.actions.close();
    ui.actions.collapse();
  }

  async function submitForm() {
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
        event.RepeatStartDay = dayjs().format('DD');
        event.RepeatStartMonth = dayjs().format('MM');
        event.RepeatStartYear = dayjs().format('YYYY');
        if (formData.recurrenceType === ScheduleRepeatType.Weekly) {
          event.RepeatWeeklyData = formData.recurrenceWeeklyDays.join(
            ','
          ) as ScheduleRepeatWeeklyData;
        }
        if (formData.hasRecurrenceEndDate) {
          event.RepeatEndDay = dayjs(formData.recurrenceEndDate).format('DD');
          event.RepeatEndMonth = dayjs(formData.recurrenceEndDate).format('MM');
          event.RepeatEndYear = dayjs(formData.recurrenceEndDate).format('YYYY');
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
  }

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

  return (
    <StyledCalendarCreateEvent
      onSubmit={(e) => e.preventDefault()}
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
        <button type='button' onClick={closeModal}>
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
            <TileOptionsContainer>
              {tileOptions.map((option) => (
                <TileOption key={option.title}>
                  <TileOptionHeader>{option.title}</TileOptionHeader>
                  {option.content}
                </TileOption>
              ))}
            </TileOptionsContainer>
          </Section>
          <Spacer />
          <SummaryContainer $darkmode={isDarkMode} $color={formData.color}>
            <header>{t('calendar.createTile.summary.title')}</header>
            <p>
              <Trans
                i18nKey="calendar.createTile.summary.description"
                components={{
                  b: <b />,
                }}
                values={{
                  action: formData.action,
                  location: formData.location,
                  hours: formData.durationHours,
                  minutes: formData.durationMins,
                  deadline: dayjs(formData.deadline)
                    .toDate()
                    .toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                    }),
                }}
              />
            </p>
          </SummaryContainer>
        </>
      )}
      <ButtonContainer $isexpanded={ui.state.isExpanded}>
        <Button
					type='button'
          variant={'ghost'}
          onClick={ui.state.isExpanded ? ui.actions.collapse : ui.actions.expand}
        >
          {ui.state.isExpanded
            ? t('calendar.createTile.buttons.collapse')
            : t('calendar.createTile.buttons.expand')}
        </Button>
        <Button type='button' variant={'ghost'} onClick={resetForm}>
          {t('calendar.createTile.buttons.reset')}
        </Button>
        <Button
          variant="brand"
          type="submit"
          onClick={submitForm}
          disabled={!isValidSubmission}
        >
          {t('calendar.createTile.buttons.submit')}
        </Button>
      </ButtonContainer>
    </StyledCalendarCreateEvent>
  );
};

const SummaryContainer = styled.div<{ $darkmode: boolean; $color: RGB }>`
	${({ theme, $darkmode, $color }) => {
    const summaryColor = new RGBColor($color);
    return `
			position: sticky;
			bottom: calc(52px + 1rem);
			font-family: ${theme.typography.fontFamily.urban};
			font-size: ${theme.typography.fontSize.base};
			margin-bottom: 1rem;
			margin-right: 1rem;
			margin-left: auto;
			width: 100%;
			max-width: ${theme.screens.md};
			border-radius: ${theme.borderRadius.xLarge};
			padding: 1rem;
			color: ${summaryColor.setLightness($darkmode ? 0.85 : 0.3).toHex()};
			border: 1px solid ${summaryColor.setLightness($darkmode ? 0.3 : 0.8).toHex()};
			background-color: ${summaryColor.setLightness($darkmode ? 0.2 : 0.9).toHex()};
			font-weight: ${theme.typography.fontWeight.semibold};

			transition: color 0.2s ease-in-out, background-color 0.2s ease-in-out, border-color 0.2s ease-in-out;

			b {
				color: ${summaryColor.setLightness($darkmode ? 0.95 : 0.2).toHex()};
				border-bottom: 1px solid ${summaryColor.setLightness($darkmode ? 0.95 : 0.2).toHex()};
				min-width: 20px;
				display: inline-block;
				transition: color 0.2s ease-in-out, border-color 0.2s ease-in-out;
			}

			header {
				background-color: ${summaryColor.setLightness($darkmode ? 0.3 : 1).toHex()};
				color: ${summaryColor.setLightness($darkmode ? 0.95 : 0.2).toHex()};
				width: fit-content;
				padding: 0.25rem 0.75rem !important;
				border-radius: ${theme.borderRadius.large} !important;
				margin-bottom: 0.5rem;
        transition: background-color 0.2s ease-in-out, color 0.2s ease-in-out;
			}
		`;
  }}
`;

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

const TileColorOptions = styled.div`
	display: flex;
	flex-wrap: wrap;
	gap: 0.75rem;
	justify-content: center;
	padding: 0.5rem 0;
`;

const TileColorOption = styled.button<{ $color: RGBColor; $selected: boolean }>`
	background-color: ${({ $color }) => $color.setLightness(0.6).toHex()};
	border-radius: 50%;
	height: 2rem;
	aspect-ratio: 1 / 1;

	display: flex;
	flex-direction: column;
	gap: 0.5rem;
	position: relative;
	outline: ${(props) =>
    props.$selected ? `2px solid ${props.theme.colors.brand[500]}` : '2px solid transparent'};
	outline-offset: 4px;
	transition: outline 0.2s ease-in-out;
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

const RecurrenceWeekdayOptionsHeader = styled.h3`
	font-family: ${(props) => props.theme.typography.fontFamily.urban};
	font-weight: ${(props) => props.theme.typography.fontWeight.semibold};
	color: ${(props) => props.theme.colors.text.secondary};
`;

const RecurrenceWeekdayOptions = styled.div`
	display: flex;
	gap: 0.75rem;
`;

const RecurrenceOptions = styled.div`
	display: flex;
	flex-wrap: wrap;
	gap: 1.5rem;
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

const TileActionToggleContainer = styled.div`
	display: flex;
	flex-direction: column;
	margin-bottom: 1rem;

	label {
		font-family: ${(props) => props.theme.typography.fontFamily.urban};
		font-weight: ${(props) => props.theme.typography.fontWeight.semibold};
		color: ${(props) => props.theme.colors.text.primary};
	}
`;

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

const DescriptionDatePickerContainer = styled.div`
	width: 150px;
	position: relative;
`;
const DescriptionDatePickerDisplay = styled.div`
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

const DescriptionContainer = styled.div`
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
