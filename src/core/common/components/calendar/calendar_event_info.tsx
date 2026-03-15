import React, { useState, useEffect } from 'react';
import { ScheduleSubCalendarEvent } from '../../types/schedule';
import styled from 'styled-components';
import {
  CalendarArrowDown,
  CalendarArrowUp,
  Check,
  Clock,
  ExternalLink,
  Pencil,
  Repeat2,
  Star,
  Target,
  X,
} from 'lucide-react';
import { RGBColor } from '@/core/util/colors';
import dayjs from 'dayjs';
import TimeUtil from '@/core/util/time';
import calendarConfig from '@/core/constants/calendar_config';
import { useTranslation } from 'react-i18next';
import DatePicker from '@/core/common/components/date_picker';
import TimeDropdown from '@/core/common/components/TimeDropdown';
import {
  dateTimeToUnix,
  unixToDateString,
  unixToTimeString,
  validateTimeRange,
} from '@/core/util/eventTimeConversion';
import LocationBG from '@/assets/event/location-bg.png';
import { useTheme } from '@/core/theme/ThemeProvider';

type CalendarEventInfoProps = {
  event: ScheduleSubCalendarEvent | null;
  onClose?: () => void;
  onEventUpdate?: (updates: { name?: string; start?: number; end?: number; calendarEnd?: number }) => void;
  isEditable?: boolean;
};

const CalendarEventInfo: React.FC<CalendarEventInfoProps> = ({
  event,
  onClose,
  onEventUpdate,
  isEditable = true,
}) => {
  const { t } = useTranslation();
  const { isDarkMode } = useTheme();

  // Edit mode flags
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingStartTime, setIsEditingStartTime] = useState(false);
  const [isEditingEndTime, setIsEditingEndTime] = useState(false);
  const [isEditingDeadline, setIsEditingDeadline] = useState(false);

  // Edited values
  const [editedName, setEditedName] = useState('');
  const [editedDate, setEditedDate] = useState('');
  const [editedStartTime, setEditedStartTime] = useState('');
  const [editedEndTime, setEditedEndTime] = useState('');
  const [editedDeadline, setEditedDeadline] = useState('');

  // Track pending changes
  const [hasChanges, setHasChanges] = useState(false);

  // Validation error
  const [validationError, setValidationError] = useState<string | null>(null);

  // Initialize state from event
  useEffect(() => {
    if (event) {
      setEditedName(event.name);
      setEditedDate(unixToDateString(event.start));
      setEditedStartTime(unixToTimeString(event.start));
      setEditedEndTime(unixToTimeString(event.end));
      setEditedDeadline(unixToDateString(event.calendarEventEnd));
      setHasChanges(false);
      setValidationError(null);
      setIsEditingName(false);
      setIsEditingStartTime(false);
      setIsEditingEndTime(false);
      setIsEditingDeadline(false);
    }
  }, [event]);

  function getEventDueIn(event: ScheduleSubCalendarEvent) {
    const now = dayjs();
    const eventStart = dayjs(event.start);
    const diffInHours = eventStart.diff(now, 'hour');
    if (diffInHours < 1) {
      const diffInMinutes = eventStart.diff(now, 'minute');
      return `${diffInMinutes} minutes`;
    } else if (diffInHours < 24) {
      return `${diffInHours} hours`;
    } else {
      const diffInDays = eventStart.diff(now, 'day');
      return `${diffInDays} days`;
    }
  }

  const handleCancel = () => {
    if (event) {
      setEditedName(event.name);
      setEditedDate(unixToDateString(event.start));
      setEditedStartTime(unixToTimeString(event.start));
      setEditedEndTime(unixToTimeString(event.end));
      setEditedDeadline(unixToDateString(event.calendarEventEnd));
    }
    setHasChanges(false);
    setValidationError(null);
    setIsEditingName(false);
    setIsEditingStartTime(false);
    setIsEditingEndTime(false);
    setIsEditingDeadline(false);
  };

  const handleSave = () => {
    if (!event) return;

    if (!validateTimeRange(editedDate, editedStartTime, editedEndTime)) {
      setValidationError(t('calendar.event.validation.endAfterStart'));
      return;
    }

    setValidationError(null);

    const newStart = dateTimeToUnix(editedDate, editedStartTime);
    const newEnd = dateTimeToUnix(editedDate, editedEndTime);
    const deadlineTime = dayjs(event.calendarEventEnd).format('h:mm A');
    const newCalendarEnd = dateTimeToUnix(editedDeadline, deadlineTime);

    const updates: { name?: string; start?: number; end?: number; calendarEnd?: number } = {};

    if (editedName !== event.name) {
      updates.name = editedName;
    }
    if (newStart !== event.start) {
      updates.start = newStart;
    }
    if (newEnd !== event.end) {
      updates.end = newEnd;
    }
    if (newCalendarEnd !== event.calendarEventEnd) {
      updates.calendarEnd = newCalendarEnd;
    }

    if (Object.keys(updates).length === 0) {
      setHasChanges(false);
      return;
    }

    onEventUpdate?.(updates);
    setHasChanges(false);
  };

  const eventColor = new RGBColor({
    r: event ? event.colorRed : 128,
    g: event ? event.colorGreen : 128,
    b: event ? event.colorBlue : 128,
  });

  // Compute duration display
  const getDurationDisplay = () => {
    if (hasChanges && editedDate && editedStartTime && editedEndTime) {
      const startUnix = dateTimeToUnix(editedDate, editedStartTime);
      const endUnix = dateTimeToUnix(editedDate, editedEndTime);
      return TimeUtil.rangeDuration(dayjs(startUnix), dayjs(endUnix));
    }
    return event
      ? TimeUtil.rangeDuration(dayjs(event.start), dayjs(event.end))
      : '';
  };

  return event ? (
    <StyledCalendarEventInfo $color={eventColor} $darkmode={isDarkMode}>
      <CalendarEventInfoHeader>
        <div className="icon">
          <Star size={16} color={eventColor.setLightness(0.6).toHex()} />
        </div>
        <div className="title">
          {isEditingName ? (
            <EditableFieldWrapper>
              <NameInput
                type="text"
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                onBlur={() => {
                  setIsEditingName(false);
                  if (editedName !== event.name) {
                    setHasChanges(true);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setIsEditingName(false);
                    if (editedName !== event.name) {
                      setHasChanges(true);
                    }
                  } else if (e.key === 'Escape') {
                    setEditedName(event.name);
                    setIsEditingName(false);
                  }
                }}
                autoFocus
              />
            </EditableFieldWrapper>
          ) : (
            <EditableName
              $isEditable={isEditable}
              onClick={() => isEditable && setIsEditingName(true)}
            >
              <h2>{hasChanges ? editedName : event.name}</h2>
              {isEditable && <Pencil size={14} className="edit-icon" />}
            </EditableName>
          )}
          {dayjs().isBefore(dayjs(event.start)) ? (
            <span>{t('calendar.event.dueIn', { time: getEventDueIn(event) })}</span>
          ) : null}
        </div>
        <button onClick={onClose}>
          <X size={16} color={eventColor.setLightness(0.5).toHex()} />
        </button>
      </CalendarEventInfoHeader>
      <CalendarEventInfoSection>
        <CalendarEventInfoArticleContainer>
          {/* Start Time Field */}
          <CalendarEventInfoArticle>
            <CalendarArrowUp
              size={16}
              color={eventColor.setLightness(0.6).toHex()}
              style={{ minWidth: 16, marginTop: '0.25rem' }}
            />
            <div>
              <h3>{t('calendar.event.startLabel')}</h3>
              {isEditingStartTime ? (
                <EditableFieldWrapper>
                  <TimeDropdown
                    value={editedStartTime}
                    onChange={(time) => {
                      setEditedStartTime(time);
                      setHasChanges(true);
                      setIsEditingStartTime(false);
                    }}
                    interval={15}
                  />
                </EditableFieldWrapper>
              ) : (
                <EditableValue
                  $isEditable={isEditable}
                  onClick={() => isEditable && setIsEditingStartTime(true)}
                >
                  <span>{hasChanges ? editedStartTime : dayjs(event.start).format('h:mm A')}</span>
                  {isEditable && <Pencil size={12} className="edit-icon" />}
                </EditableValue>
              )}
              <TimeDate>
                {hasChanges
                  ? dayjs(editedDate).format('D MMM')
                  : dayjs(event.start).format('D MMM')}
              </TimeDate>
            </div>
          </CalendarEventInfoArticle>

          {/* End Time Field */}
          <CalendarEventInfoArticle>
            <CalendarArrowDown
              size={16}
              color={eventColor.setLightness(0.6).toHex()}
              style={{ minWidth: 16, marginTop: '0.25rem' }}
            />
            <div>
              <h3>{t('calendar.event.endLabel')}</h3>
              {isEditingEndTime ? (
                <EditableFieldWrapper>
                  <TimeDropdown
                    value={editedEndTime}
                    onChange={(time) => {
                      setEditedEndTime(time);
                      setHasChanges(true);
                      setIsEditingEndTime(false);
                    }}
                    interval={15}
                  />
                </EditableFieldWrapper>
              ) : (
                <EditableValue
                  $isEditable={isEditable}
                  onClick={() => isEditable && setIsEditingEndTime(true)}
                >
                  <span>{hasChanges ? editedEndTime : dayjs(event.end).format('h:mm A')}</span>
                  {isEditable && <Pencil size={12} className="edit-icon" />}
                </EditableValue>
              )}
              <TimeDate>
                {hasChanges
                  ? (() => {
                      const startUnix = dateTimeToUnix(editedDate, editedStartTime);
                      const endUnix = dateTimeToUnix(editedDate, editedEndTime);
                      // If end time is before start time, it's the next day
                      const endDate = endUnix <= startUnix
                        ? dayjs(editedDate).add(1, 'day')
                        : dayjs(editedDate);
                      return endDate.format('D MMM');
                    })()
                  : dayjs(event.end).format('D MMM')}
              </TimeDate>
            </div>
          </CalendarEventInfoArticle>

          {/* Deadline Field (full width row) */}
          <CalendarEventInfoArticle style={{ gridColumn: '1 / 3' }}>
            <Target
              size={16}
              color={eventColor.setLightness(0.6).toHex()}
              style={{ minWidth: 16, marginTop: '0.25rem' }}
            />
            <div>
              <h3>{t('calendar.event.deadlineLabel')}</h3>
              {isEditingDeadline ? (
                <EditableFieldWrapper>
                  <DatePicker
                    value={editedDeadline}
                    onChange={(date) => {
                      if (!date) return;
                      setEditedDeadline(date);
                      setHasChanges(true);
                      setIsEditingDeadline(false);
                    }}
                  />
                </EditableFieldWrapper>
              ) : (
                <EditableValue
                  $isEditable={isEditable}
                  onClick={() => isEditable && setIsEditingDeadline(true)}
                >
                  <span>
                    {hasChanges
                      ? dayjs(editedDeadline).format('ddd, D MMMM, YYYY')
                      : dayjs(event.calendarEventEnd).format('ddd, D MMMM, YYYY')}
                  </span>
                  {isEditable && <Pencil size={12} className="edit-icon" />}
                </EditableValue>
              )}
            </div>
          </CalendarEventInfoArticle>

          {/* Duration Field (read-only, auto-updates) */}
          <CalendarEventInfoArticle>
            <Clock
              size={16}
              color={eventColor.setLightness(0.6).toHex()}
              style={{ minWidth: 16, marginTop: '0.25rem' }}
            />
            <div>
              <h3>{t('calendar.event.durationLabel')}</h3>
              <p>{getDurationDisplay()}</p>
            </div>
          </CalendarEventInfoArticle>

          {/* Repetition Field */}
          <CalendarEventInfoArticle>
            <Repeat2
              size={16}
              color={eventColor.setLightness(0.6).toHex()}
              style={{ minWidth: 16, marginTop: '0.25rem' }}
            />
            <div>
              <h3>{t('calendar.event.repetitionLabel')}</h3>
              <p>{event.isRecurring ? 'Yes' : 'No'}</p>
            </div>
          </CalendarEventInfoArticle>
        </CalendarEventInfoArticleContainer>
      </CalendarEventInfoSection>

      {/* Validation Error */}
      {validationError && (
        <ValidationError>{validationError}</ValidationError>
      )}

      {/* Save/Cancel Buttons */}
      {hasChanges && (
        <SaveButtonContainer>
          <IconButton onClick={handleCancel} title={t('calendar.event.cancel')}>
            <X size={16} />
          </IconButton>
          <IconButton $primary onClick={handleSave} title={t('calendar.event.save')}>
            <Check size={16} />
          </IconButton>
        </SaveButtonContainer>
      )}

      {event.location.address && (
        <>
          <hr />
          <CalendarEventInfoSection>
            <a href={event.location.address}>
              <CalendarEventInfoLocation $color={eventColor}>
                <img src={LocationBG} alt="" width={16} />
                <div>
                  <h3>{t('calendar.event.locationLabel')}</h3>
                  <ExternalLink size={16} />
                </div>
              </CalendarEventInfoLocation>
            </a>
          </CalendarEventInfoSection>
        </>
      )}
    </StyledCalendarEventInfo>
  ) : null;
};

const EditableValue = styled.p<{ $isEditable: boolean }>`
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: ${({ $isEditable }) => ($isEditable ? 'pointer' : 'default')};
  padding: 2px 4px;
  margin: -2px -4px;
  border-radius: ${({ theme }) => theme.borderRadius.small};
  transition: background-color 0.2s ease;

  .edit-icon {
    opacity: 0.4;
    transition: opacity 0.2s ease;
    flex-shrink: 0;
  }

  ${({ $isEditable, theme }) =>
    $isEditable &&
    `
    &:hover {
      background-color: ${theme.colors.gray[700]};

      .edit-icon {
        opacity: 0.8;
      }
    }
  `}
`;

const EditableName = styled.div<{ $isEditable: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: ${({ $isEditable }) => ($isEditable ? 'pointer' : 'default')};
  padding: 2px 4px;
  margin: -2px -4px;
  border-radius: ${({ theme }) => theme.borderRadius.small};
  transition: background-color 0.2s ease;

  h2 {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .edit-icon {
    opacity: 0.4;
    transition: opacity 0.2s ease;
    flex-shrink: 0;
  }

  ${({ $isEditable }) =>
    $isEditable &&
    `
    &:hover {
      background-color: rgba(255, 255, 255, 0.1);

      .edit-icon {
        opacity: 0.8;
      }
    }
  `}
`;

const NameInput = styled.input`
  width: 100%;
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  font-family: ${({ theme }) => theme.typography.fontFamily.urban};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  background: transparent;
  border: none;
  border-bottom: 2px solid ${({ theme }) => theme.colors.brand[500]};
  color: inherit;
  outline: none;
  padding: 2px 0;

  &:focus {
    border-bottom-color: ${({ theme }) => theme.colors.brand[400]};
  }
`;

const TimeDate = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.gray[500]};
  margin-top: 2px;
`;

const EditableFieldWrapper = styled.div`
  /* TimeDropdown select styling */
  select {
    font-size: ${({ theme }) => theme.typography.fontSize.sm};
    padding: 4px 24px 4px 8px;
    height: 28px;
    min-width: 90px;
  }

  .react-datepicker-wrapper {
    width: 150px;
  }

  .react-datepicker__input-container input {
    height: 28px;
    padding: 4px 8px;
    font-size: ${({ theme }) => theme.typography.fontSize.sm};
  }
`;

const ValidationError = styled.div`
  padding: 8px 16px;
  color: ${({ theme }) => theme.colors.error[400]};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
`;

const SaveButtonContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  padding: 8px 16px;
  border-top: 1px solid ${({ theme }) => theme.colors.gray[700]};
  gap: 8px;
`;

const IconButton = styled.button<{ $primary?: boolean }>`
  width: 28px;
  height: 28px;
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  cursor: pointer;
  transition: background-color 0.2s ease;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;

  ${({ $primary, theme }) =>
    $primary
      ? `
    background-color: ${theme.colors.brand[500]};
    color: ${theme.colors.white};

    &:hover {
      background-color: ${theme.colors.brand[600]};
    }
  `
      : `
    background-color: ${theme.colors.gray[700]};
    color: ${theme.colors.gray[300]};

    &:hover {
      background-color: ${theme.colors.gray[600]};
    }
  `}
`;

const CalendarEventInfoHeader = styled.header`
  position: sticky;
  top: 0;
`;

const CalendarEventInfoLocation = styled.div<{ $color: RGBColor }>`
  position: relative;
  height: 100px;
  border: 1px solid ${({ theme }) => theme.colors.calendar.border};
  border-radius: ${({ theme }) => theme.borderRadius.large};
  isolation: isolate;
  overflow: hidden;
  cursor: pointer;

  img {
    position: absolute;
    width: 100%;
    height: 100%;
    object-fit: cover;
    top: 0;
    left: 0;
    z-index: -1;
  }

  &:hover div {
    transform: translate(-50%, -60%);

    h3 {
      color: ${(props) => props.$color.setLightness(0.8).toHex()};
    }
  }

  div {
    background-color: rgba(0, 0, 0, 0.5);
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    border-radius: ${({ theme }) => theme.borderRadius.large};
    padding: 0.5rem;
    transition: transform 0.3s ease;

    h3 {
      white-space: nowrap;
      font-size: ${({ theme }) => theme.typography.fontSize.sm};
      font-family: ${({ theme }) => theme.typography.fontFamily.urban};
      font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
      color: ${({ theme }) => theme.colors.white};
      leading: 1;
    }
  }
`;

const CalendarEventInfoSection = styled.div`
  padding: 16px;
`;

const CalendarEventInfoArticleContainer = styled.div`
  padding: 0.5rem;
  display: grid;
  gap: 0.5rem;
  grid-template-columns: 1fr 1fr;
  border-radius: ${({ theme }) => theme.borderRadius.large};
  border: 1px solid ${({ theme }) => theme.colors.calendar.border};
`;

const CalendarEventInfoArticle = styled.article`
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;

  > div {
    display: flex;
    gap: 0.1rem;
    flex-direction: column;

    h3 {
      font-size: ${({ theme }) => theme.typography.fontSize.sm};
      font-family: ${({ theme }) => theme.typography.fontFamily.urban};
      font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
      color: ${({ theme }) => theme.colors.text.muted};
      leading: 1;
    }

    p {
      font-size: ${({ theme }) => theme.typography.fontSize.sm};
      font-family: ${({ theme }) => theme.typography.fontFamily.urban};
      font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
      color: ${({ theme }) => theme.colors.text.secondary};

      a {
        color: ${({ theme }) => theme.colors.text.secondary};
        text-decoration: none;
        span {
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }

        &:hover {
          text-decoration: underline;
        }
      }
    }
  }
`;

const StyledCalendarEventInfo = styled.div<{ $color: RGBColor; $darkmode: boolean }>`
  background-color: ${({ theme }) => theme.colors.calendar.eventInfoModalBg};
  border-radius: ${({ theme }) => theme.borderRadius.xLarge};
  width: 100%;
  max-height: ${calendarConfig.INFO_MODAL_HEIGHT};
  overflow-y: auto;
  border: 1px solid ${({ theme, $darkmode }) => (!$darkmode ? theme.colors.gray[300] : 'transparent')};

  hr {
    border: none;
    height: 1px;
    background-color: ${({ theme }) => theme.colors.calendar.border};
  }

  header {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    gap: 0.5rem;
    background-color: ${({ $color, $darkmode }) => $color.setLightness($darkmode ? 0.2 : 0.9).toHex()};
    padding: 8px 16px;
    border-radius: ${({ theme }) => theme.borderRadius.xLarge} ${({ theme }) => theme.borderRadius.xLarge} 0 0;

    .icon {
      display: flex;
      justify-content: center;
      align-items: center;
      width: 32px;
      height: 32px;
      background-color: ${({ $color, $darkmode }) => $color.setLightness($darkmode ? 0.2 : 1).toHex()};
      border: 1px solid ${({ $color, $darkmode }) => $color.setLightness($darkmode ? 0.3 : 0.8).toHex()};
      border-radius: ${({ theme }) => theme.borderRadius.medium};
    }

    > button {
      height: 28px;
      width: 28px;
      border: 1px solid ${({ $color, $darkmode }) => $color.setLightness($darkmode ? 0.3 : 0.8).toHex()};
      border-radius: ${({ theme }) => theme.borderRadius.medium};
      display: flex;
      justify-content: center;
      align-items: center;
      transition: background-color 0.2s;

      &:hover {
        background-color: ${({ $color, $darkmode }) => $color.setLightness($darkmode ? 0.3 : 0.8).toHex()};
      }
    }
  }

  .title {
    flex: 1;
    overflow: hidden;
    display: flex;
    flex-direction: column;

    h2 {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      font-size: ${({ theme }) => theme.typography.fontSize.lg};
      font-family: ${({ theme }) => theme.typography.fontFamily.urban};
      font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
      color: ${({ $color, $darkmode }) => $color.setLightness($darkmode ? 0.8 : 0.2).toHex()};
    }
    span {
      font-size: ${({ theme }) => theme.typography.fontSize.xs};
      font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
      color: ${({ $color, $darkmode }) => $color.setLightness($darkmode ? 0.6 : 0.4).toHex()};
    }
  }

  .event-header {
    display: flex;
    align-items: top;
    gap: 0.75rem;
    margin-bottom: 0.75rem;

    h3 {
      margin-top: -0.5rem;
      font-size: ${({ theme }) => theme.typography.fontSize.base};
      font-family: ${({ theme }) => theme.typography.fontFamily.urban};
      font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
      color: ${({ theme }) => theme.colors.gray[100]};
    }

    p {
      font-size: ${({ theme }) => theme.typography.fontSize.xs};
      color: ${({ theme }) => theme.colors.gray[300]};
    }
  }
`;

export default CalendarEventInfo;
