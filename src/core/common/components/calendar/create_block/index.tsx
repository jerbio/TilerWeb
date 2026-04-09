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
} from '../../../types/schedule';
import { useCalendarDispatch } from '../CalendarRequestProvider';
import {
  CalendarEntityType,
  CalendarRequestResult,
  CalendarRequestStatus,
  CalendarRequestType,
} from '../calendarRequestContext';
import { Actions } from '@/core/constants/enums';
import { useCalendarUI } from '../calendar-ui.provider';
import { StyledCalendarCreateEvent, StyledCalendarCreateEventActions } from '../create_tile';
import CreateBlockInfo from './info';
import { toast } from 'sonner';
import { scheduleService } from '@/services';
import TimeUtil from '@/core/util/time';

dayjs.extend(advancedFormat);

export type InitialCreateBlockFormState = {
  name: string;
  start: dayjs.Dayjs;
  startTime: string;
  durationHours: number;
  durationMins: number;
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
  const { formData, resetForm } = formHandler;
  const ui = useCalendarUI((state) => state.createBlock);
  const theme = useStyledTheme();
  const calendarDispatch = useCalendarDispatch();
  const { t } = useTranslation();

  const isValidSubmission = useMemo(() => {
    if (formData.name.trim().length === 0) return false;
    const duration = formData.durationHours * 60 + formData.durationMins;
    if (duration === 0) return false;
    return true;
  }, [formData]);

  async function submitForm() {
    if (!isValidSubmission) return;
    ui.actions.startLoading(formData.name);
    try {
			const startMinutes = TimeUtil.meridianToMins(formData.startTime);
      const startHour = startMinutes / 60;
      const startMinute = startMinutes % 60;

      // Compute end time based on start time and duration
      const start = dayjs(formData.start).set('hour', startHour).set('minute', startMinute);
      const end = start
        .add(formData.durationHours, 'hour')
        .add(formData.durationMins, 'minute');

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
        StartDay: formData.start.format('DD'),
        StartYear: formData.start.format('YYYY'),
        StartMonth: formData.start.format('MM'),
        StartHour: startHour.toString(),
        StartMinute: startMinute.toString(),
        EndDay: end.format('DD'),
        EndYear: end.format('YYYY'),
        EndMonth: end.format('MM'),
        EndHour: end.hour().toString(),
        EndMinute: end.minute().toString(),
        DurationDays: '0',
        DurationHours: formData.durationHours.toString(),
        DurationMinute: formData.durationMins.toString(),
        isRestricted: ScheduleBooleanString.False,
        MobileApp: true,
      };

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

  function viewCreatedEvent() {
    const successBlock = ui.state.success.block;
    if (!successBlock || successBlock.calendarEvent.id === null) return;
    calendarDispatch(
      {
        type: CalendarRequestType.FocusEvent,
        entityId: successBlock.calendarEvent.id,
        entityType: CalendarEntityType.CalendarEvent,
       actionType: Actions.Add_New_Task,
      },
      (result: CalendarRequestResult) => {
        if (result.status === CalendarRequestStatus.Navigating) {
          ui.actions.navigateToBlock();
        } else {
          ui.actions.navigateToBlockComplete();
          ui.actions.hideSuccess();
          if (result.status === CalendarRequestStatus.NotFound) {
            console.warn(
              '[CreateBlock] Calendar could not find entity:',
              successBlock.calendarEvent.id
            );
          }
        }
      }
    );
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
            onClick: viewCreatedEvent,
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

const Section = styled.section<{ $isexpanded: boolean }>`
	padding: 1rem 1.25rem;
	width: 100%;
	max-width: ${(props) => props.theme.screens.md};
	margin-inline: auto;
	border-inline: ${(props) => (props.$isexpanded ? '0px' : '1px')} solid
		${(props) => props.theme.colors.border.strong};
`;

export default CalendarCreateBlock;
