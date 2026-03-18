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
  Play,
  Repeat2,
  SkipForward,
  Star,
  Target,
  X,
} from 'lucide-react';
import { RGBColor } from '@/core/util/colors';
import dayjs from 'dayjs';
import TimeUtil from '@/core/util/time';
import { useTranslation } from 'react-i18next';
import DatePicker from '@/core/common/components/date_picker';
import TimeDropdown from '@/core/common/components/TimeDropdown';
import {
  adjustEndDateTime,
  dateTimeToUnix,
  calculateDuration,
  formatDueIn,
  timeToDate,
  unixToTimeString,
  validateDateTimeRange,
} from '@/core/util/eventTimeConversion';
import LocationBG from '@/assets/event/location-bg.png';
import { useTheme } from '@/core/theme/ThemeProvider';
import calendarConfig from '@/core/constants/calendar_config';
import Loader from '../loader';

type CalendarEventInfoProps = {
  event: ScheduleSubCalendarEvent | null;
  onClose?: () => void;
  onEventUpdate?: (updates: { name?: string; start?: number; end?: number; calendarEnd?: number }) => void;
  onSetAsNow?: () => Promise<void>;
  onMarkComplete?: () => Promise<void>;
  onDefer?: () => void;
  isEditable?: boolean;
  isSaving?: boolean;
};

const CalendarEventInfo: React.FC<CalendarEventInfoProps> = ({
  event,
  onClose,
  onEventUpdate,
  onSetAsNow,
  onMarkComplete,
  onDefer,
  isEditable = true,
  isSaving = false,
}) => {
  const { t } = useTranslation();
  const { isDarkMode } = useTheme();

  // Edit mode flags
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingStart, setIsEditingStart] = useState(false);
  const [isEditingEnd, setIsEditingEnd] = useState(false);
  const [isEditingDeadline, setIsEditingDeadline] = useState(false);

  // Edited values
  const [editedName, setEditedName] = useState('');
  const [editedStartDate, setEditedStartDate] = useState('');
  const [editedStartTime, setEditedStartTime] = useState('');
  const [editedEndDate, setEditedEndDate] = useState('');
  const [editedEndTime, setEditedEndTime] = useState('');
  const [editedDeadline, setEditedDeadline] = useState('');

  // Track pending changes
  const [hasChanges, setHasChanges] = useState(false);

  // Validation error
  const [validationError, setValidationError] = useState<string | null>(null);

  // Action button states
  const [actionLoading, setActionLoading] = useState<'now' | 'complete' | null>(null);
  const [confirmingComplete, setConfirmingComplete] = useState(false);

  // Use original times (preserved before visual splitting) or fall back to start/end
  const eventStart = event?.originalStart ?? event?.start ?? 0;
  const eventEnd = event?.originalEnd ?? event?.end ?? 0;

  // Initialize state from event
  useEffect(() => {
    if (event) {
      setEditedName(event.name);
      setEditedStartDate(timeToDate(eventStart));
      setEditedStartTime(unixToTimeString(eventStart));
      setEditedEndDate(timeToDate(eventEnd));
      setEditedEndTime(unixToTimeString(eventEnd));
      setEditedDeadline(timeToDate(event.calendarEventEnd));
      setHasChanges(false);
      setValidationError(null);
      setIsEditingName(false);
      setIsEditingStart(false);
      setIsEditingEnd(false);
      setIsEditingDeadline(false);
      setActionLoading(null);
      setConfirmingComplete(false);
    }
  }, [event, eventStart, eventEnd]);

  const handleCancel = () => {
    if (event) {
      setEditedName(event.name);
      setEditedStartDate(timeToDate(eventStart));
      setEditedStartTime(unixToTimeString(eventStart));
      setEditedEndDate(timeToDate(eventEnd));
      setEditedEndTime(unixToTimeString(eventEnd));
      setEditedDeadline(timeToDate(event.calendarEventEnd));
    }
    setHasChanges(false);
    setValidationError(null);
    setIsEditingName(false);
    setIsEditingStart(false);
    setIsEditingEnd(false);
    setIsEditingDeadline(false);
  };

  const handleSave = () => {
    if (!event) return;

    // Validate that end datetime is after start datetime
    if (!validateDateTimeRange(editedStartDate, editedStartTime, editedEndDate, editedEndTime)) {
      setValidationError(t('calendar.event.validation.endAfterStart'));
      return;
    }

    const newStart = dateTimeToUnix(editedStartDate, editedStartTime);
    const newEnd = dateTimeToUnix(editedEndDate, editedEndTime);

    setValidationError(null);
    const deadlineTime = dayjs(event.calendarEventEnd).format('h:mm A');
    const newCalendarEnd = dateTimeToUnix(editedDeadline, deadlineTime);

    const updates: { name?: string; start?: number; end?: number; calendarEnd?: number } = {};

    if (editedName !== event.name) {
      updates.name = editedName;
    }
    if (newStart !== eventStart) {
      updates.start = newStart;
    }
    if (newEnd !== eventEnd) {
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

  const handleSetAsNow = async () => {
    if (!onSetAsNow || actionLoading) return;
    setActionLoading('now');
    try {
      await onSetAsNow();
    } finally {
      setActionLoading(null);
    }
  };

  const handleConfirmComplete = async () => {
    if (!onMarkComplete || actionLoading) return;
    setConfirmingComplete(false);
    setActionLoading('complete');
    try {
      await onMarkComplete();
    } finally {
      setActionLoading(null);
    }
  };

  const eventColor = new RGBColor({
    r: event ? event.colorRed : 128,
    g: event ? event.colorGreen : 128,
    b: event ? event.colorBlue : 128,
  });

  // Compute duration display
  const getDurationDisplay = () => {
    if (hasChanges && editedStartDate && editedStartTime && editedEndDate && editedEndTime) {
      return calculateDuration(editedStartDate, editedStartTime, editedEndDate, editedEndTime);
    }
    return event
      ? TimeUtil.rangeDuration(dayjs(eventStart), dayjs(eventEnd))
      : '';
  };

  return event ? (
    <StyledCalendarEventInfo $color={eventColor} $darkmode={isDarkMode}>
      <CalendarEventInfoHeader>
        <div className="icon">
          {event.emojis ? (
            <span className="emoji">{event.emojis}</span>
          ) : (
            <Star size={16} color={eventColor.setLightness(0.6).toHex()} />
          )}
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
          {dayjs().isBefore(dayjs(eventStart)) ? (
            <span>{t('calendar.event.dueIn', { time: formatDueIn(eventStart) })}</span>
          ) : null}
        </div>
        {hasChanges ? (
          <HeaderActions>
            <IconButton onClick={handleCancel} title={t('calendar.event.cancel')}>
              <X size={16} />
            </IconButton>
            <IconButton $primary onClick={handleSave} title={t('calendar.event.save')}>
              <Check size={16} />
            </IconButton>
          </HeaderActions>
        ) : (
          <button onClick={onClose}>
            <X size={16} color={eventColor.setLightness(0.5).toHex()} />
          </button>
        )}
      </CalendarEventInfoHeader>
      <ScrollableBody>
      {validationError && (
        <ValidationError>{validationError}</ValidationError>
      )}
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
              {isEditingStart ? (
                <>
                  <EditableFieldWrapper>
                    <TimeDropdown
                      value={editedStartTime}
                      onChange={(time) => {
                        const adjusted = adjustEndDateTime(
                          editedStartDate, editedStartTime,
                          editedStartDate, time,
                          editedEndDate, editedEndTime
                        );
                        setEditedStartTime(time);
                        setEditedEndDate(adjusted.endDate);
                        setEditedEndTime(adjusted.endTime);
                        setHasChanges(true);
                      }}
                      interval={15}
                    />
                  </EditableFieldWrapper>
                  <EditableFieldWrapper>
                    <DatePicker
                      value={editedStartDate}
                      onChange={(date) => {
                        if (!date) return;
                        const adjusted = adjustEndDateTime(
                          editedStartDate, editedStartTime,
                          date, editedStartTime,
                          editedEndDate, editedEndTime
                        );
                        setEditedStartDate(date);
                        setEditedEndDate(adjusted.endDate);
                        setEditedEndTime(adjusted.endTime);
                        setHasChanges(true);
                      }}
                      portalId="datepicker-portal"
                    />
                  </EditableFieldWrapper>
                </>
              ) : (
                <EditableValue
                  $isEditable={isEditable}
                  onClick={() => isEditable && setIsEditingStart(true)}
                >
                  <span>
                    {hasChanges ? editedStartTime : dayjs(eventStart).format('h:mm A')}
                    {' · '}
                    {hasChanges
                      ? dayjs(editedStartDate).format('D MMM')
                      : dayjs(eventStart).format('D MMM')}
                  </span>
                  {isEditable && <Pencil size={12} className="edit-icon" />}
                </EditableValue>
              )}
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
              {isEditingEnd ? (
                <>
                  <EditableFieldWrapper>
                    <TimeDropdown
                      value={editedEndTime}
                      onChange={(time) => {
                        setEditedEndTime(time);
                        setHasChanges(true);
                      }}
                      interval={15}
                    />
                  </EditableFieldWrapper>
                  <EditableFieldWrapper>
                    <DatePicker
                      value={editedEndDate}
                      onChange={(date) => {
                        if (!date) return;
                        setEditedEndDate(date);
                        setHasChanges(true);
                      }}
                      portalId="datepicker-portal"
                    />
                  </EditableFieldWrapper>
                </>
              ) : (
                <EditableValue
                  $isEditable={isEditable}
                  onClick={() => isEditable && setIsEditingEnd(true)}
                >
                  <span>
                    {hasChanges ? editedEndTime : dayjs(eventEnd).format('h:mm A')}
                    {' · '}
                    {hasChanges
                      ? dayjs(editedEndDate).format('D MMM')
                      : dayjs(eventEnd).format('D MMM')}
                  </span>
                  {isEditable && <Pencil size={12} className="edit-icon" />}
                </EditableValue>
              )}
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
                    portalId="datepicker-portal"
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

      {(onSetAsNow || onMarkComplete || onDefer) && (
        <EventActionsSection>
          {confirmingComplete ? (
            <ConfirmRow>
              <ConfirmLabel>{t('calendar.event.confirmComplete')}</ConfirmLabel>
              <ConfirmButton $success onClick={handleConfirmComplete}>
                {t('timeline.confirmAction')}
              </ConfirmButton>
              <ConfirmButton onClick={() => setConfirmingComplete(false)}>
                {t('timeline.cancelAction')}
              </ConfirmButton>
            </ConfirmRow>
          ) : (
            <EventActionsRow>
              {onSetAsNow && (
                <EventActionButton
                  onClick={handleSetAsNow}
                  disabled={!!actionLoading || hasChanges}
                  title={t('calendar.event.actions.setAsNow')}
                >
                  {actionLoading === 'now' ? <ActionSpinner /> : <Play size={14} />}
                  <span>{t('calendar.event.actions.setAsNow')}</span>
                </EventActionButton>
              )}
              {onMarkComplete && (
                <EventActionButton
                  onClick={() => setConfirmingComplete(true)}
                  disabled={!!actionLoading || hasChanges}
                  title={t('calendar.event.actions.complete')}
                  $success
                >
                  {actionLoading === 'complete' ? <ActionSpinner /> : <Check size={14} />}
                  <span>{t('calendar.event.actions.complete')}</span>
                </EventActionButton>
              )}
              {onDefer && (
                <EventActionButton
                  onClick={onDefer}
                  disabled={!!actionLoading || hasChanges}
                  title={t('calendar.event.actions.defer')}
                >
                  <SkipForward size={14} />
                  <span>{t('calendar.event.actions.defer')}</span>
                </EventActionButton>
              )}
            </EventActionsRow>
          )}
        </EventActionsSection>
      )}

      {event.location.address && (
        <>
          <hr />
          <CalendarEventInfoSection>
            <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location.address)}`} target="_blank" rel="noopener noreferrer">
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
      </ScrollableBody>

      {/* Loading Overlay */}
      <LoadingOverlay $loading={isSaving}>
        <Loader />
      </LoadingOverlay>
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

const EditableFieldWrapper = styled.div`
  /* TimeDropdown compact trigger styling */
  button {
    font-size: ${({ theme }) => theme.typography.fontSize.sm};
    padding: 4px 24px 4px 8px;
    height: 28px;
    min-width: 90px;
  }

  .react-datepicker-wrapper {
    width: 100%;
  }

  .react-datepicker__input-container input {
    height: 28px;
    padding: 4px 4px;
    font-size: ${({ theme }) => theme.typography.fontSize.xs};
    width: 100%;
  }
`;

const ValidationError = styled.div`
  padding: 8px 16px;
  color: ${({ theme }) => theme.colors.error[400]};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
`;

const HeaderActions = styled.div`
  display: flex;
  gap: 6px;
  flex-shrink: 0;
`;

const ScrollableBody = styled.div`
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;

  &::-webkit-scrollbar {
    width: 4px;
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  &::-webkit-scrollbar-thumb {
    background-color: ${({ theme }) => theme.colors.gray[400]};
    border-radius: 4px;
  }
  scrollbar-width: thin;
  scrollbar-color: ${({ theme }) => theme.colors.gray[400]} transparent;
`;

const LoadingOverlay = styled.div<{ $loading: boolean }>`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: ${({ theme }) => theme.colors.calendar.eventInfoModalBg};
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: ${({ theme }) => theme.borderRadius.xLarge};
  opacity: ${({ $loading }) => ($loading ? 0.9 : 0)};
  pointer-events: ${({ $loading }) => ($loading ? 'auto' : 'none')};
  transition: opacity 0.2s ease;
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

const CalendarEventInfoHeader = styled.header``;

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

const EventActionsSection = styled.div`
  padding: 8px 16px;
  border-top: 1px solid ${({ theme }) => theme.colors.calendar.border};
`;

const EventActionsRow = styled.div`
  display: flex;
  gap: 6px;
`;

const EventActionButton = styled.button<{ $success?: boolean; $danger?: boolean }>`
  display: flex;
  align-items: center;
  gap: 4px;
  flex: 1;
  justify-content: center;
  padding: 6px 8px;
  border: 1px solid ${({ theme, $success, $danger }) =>
    $success ? 'rgba(18, 183, 106, 0.3)'
    : $danger ? 'rgba(220, 38, 38, 0.3)'
    : theme.colors.calendar.border};
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  background: transparent;
  color: ${({ theme, $success, $danger }) =>
    $success ? '#12b76a'
    : $danger ? '#dc2626'
    : theme.colors.text.secondary};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-family: ${({ theme }) => theme.typography.fontFamily.urban};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease;

  &:hover:not(:disabled) {
    background: ${({ $success, $danger }) =>
      $success ? 'rgba(18, 183, 106, 0.1)'
      : $danger ? 'rgba(220, 38, 38, 0.1)'
      : 'rgba(255, 255, 255, 0.05)'};
    border-color: ${({ theme, $success, $danger }) =>
      $success ? 'rgba(18, 183, 106, 0.5)'
      : $danger ? 'rgba(220, 38, 38, 0.5)'
      : theme.colors.text.muted};
  }

  &:disabled {
    opacity: 0.4;
    cursor: default;
  }
`;

const ActionSpinner = styled.div`
  width: 12px;
  height: 12px;
  border: 1.5px solid ${({ theme }) => theme.colors.border.default};
  border-top-color: ${({ theme }) => theme.colors.text.secondary};
  border-radius: 50%;
  animation: action-spin 0.6s linear infinite;

  @keyframes action-spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

const ConfirmRow = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`;

const ConfirmLabel = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.text.muted};
  white-space: nowrap;
  flex: 1;
`;

const ConfirmButton = styled.button<{ $success?: boolean }>`
  padding: 4px 10px;
  border: 1px solid ${({ theme, $success }) =>
    $success ? 'rgba(18, 183, 106, 0.4)' : theme.colors.border.default};
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  background: ${({ $success }) =>
    $success ? 'rgba(18, 183, 106, 0.1)' : 'transparent'};
  color: ${({ theme, $success }) =>
    $success ? '#12b76a' : theme.colors.text.secondary};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.15s ease;

  &:hover {
    background: ${({ theme, $success }) =>
      $success ? 'rgba(18, 183, 106, 0.2)' : theme.colors.background.card2};
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
  align-items: start;
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
    min-width: 0;
    overflow: hidden;

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
  position: relative;
  display: flex;
  flex-direction: column;
  max-height: ${calendarConfig.INFO_MODAL_HEIGHT};
  background-color: ${({ theme }) => theme.colors.calendar.eventInfoModalBg};
  border-radius: ${({ theme }) => theme.borderRadius.xLarge};
  width: 100%;
  overflow: hidden;
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
      flex-shrink: 0;
      overflow: hidden;
      background-color: ${({ $color, $darkmode }) => $color.setLightness($darkmode ? 0.2 : 1).toHex()};
      border: 1px solid ${({ $color, $darkmode }) => $color.setLightness($darkmode ? 0.3 : 0.8).toHex()};
      border-radius: ${({ theme }) => theme.borderRadius.medium};

      .emoji {
        font-size: 18px;
        line-height: 1;
      }
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
