import React, { useState, useEffect, useRef } from 'react';
import styled, { css } from 'styled-components';
import { ArrowLeft, Save, Loader2, ChevronDown, Bookmark, MapPin } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { CalendarEvent, CalendarEventUpdateParams, ScheduleSubCalendarEventLocation } from '@/core/common/types/schedule';
import { scheduleService } from '@/services';
import { useUiStore, notificationId, NotificationAction } from '@/core/ui';

const COLOR_SWATCHES: { r: number; g: number; b: number }[] = [
  { r: 237, g: 18, b: 59 },   // brand red
  { r: 240, g: 61, b: 95 },   // brand light red
  { r: 52, g: 152, b: 219 },  // blue
  { r: 46, g: 204, b: 113 },  // green
  { r: 155, g: 89, b: 182 },  // purple
  { r: 241, g: 196, b: 15 },  // yellow
  { r: 230, g: 126, b: 34 },  // orange
  { r: 26, g: 188, b: 156 },  // teal
  { r: 52, g: 73, b: 94 },    // dark blue-gray
  { r: 149, g: 165, b: 166 }, // silver
  { r: 192, g: 57, b: 43 },   // dark red
  { r: 44, g: 62, b: 80 },    // midnight
];

interface EditCalendarEventProps {
  event: CalendarEvent;
  onClose: () => void;
}

/** Convert a ms-epoch to a `datetime-local` input value. */
function msToDatetimeLocal(ms: number | null): string {
  if (ms == null) return '';
  const d = new Date(ms);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Convert a `datetime-local` input value back to ms-epoch. */
function datetimeLocalToMs(value: string): number | null {
  if (!value) return null;
  return new Date(value).getTime();
}

const EditCalendarEvent: React.FC<EditCalendarEventProps> = ({ event, onClose }) => {
  const { t } = useTranslation();
  const showNotification = useUiStore((s) => s.notification.show);
  const updateNotification = useUiStore((s) => s.notification.update);

  const [name, setName] = useState(event.name ?? '');
  const [startStr, setStartStr] = useState(msToDatetimeLocal(event.start));
  const [endStr, setEndStr] = useState(msToDatetimeLocal(event.end));
  const [duration, setDuration] = useState<string>(
    event.eachTileDuration != null ? String(Math.round(event.eachTileDuration / 60000)) : ''
  );
  const [address, setAddress] = useState(event.address ?? '');
  const [addressDescription, setAddressDescription] = useState(event.addressDescription ?? '');
  const [selectedColor, setSelectedColor] = useState(() => {
    const r = event.colorRed ?? 0;
    const g = event.colorGreen ?? 0;
    const b = event.colorBlue ?? 0;
    const match = COLOR_SWATCHES.findIndex((s) => s.r === r && s.g === g && s.b === b);
    return match >= 0 ? match : 0;
  });
  const [isRecurring, setIsRecurring] = useState(event.repetition?.isEnabled ?? false);
  const [frequency, setFrequency] = useState(event.repetition?.frequency ?? '');
  const [isForever, setIsForever] = useState(event.repetition?.isForever ?? false);
  const [repetitionStartStr, setRepetitionStartStr] = useState(
    msToDatetimeLocal(event.repetition?.repetitionTimeline?.start ?? null)
  );
  const [repetitionEndStr, setRepetitionEndStr] = useState(
    msToDatetimeLocal(event.repetition?.repetitionTimeline?.end ?? null)
  );
  const [weekDays, setWeekDays] = useState<Set<string>>(() => {
    const wd = event.repetition?.weekDays;
    return wd ? new Set(wd.split(',').map((s) => s.trim())) : new Set<string>();
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [locationResults, setLocationResults] = useState<ScheduleSubCalendarEventLocation[]>([]);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const userEditedAddressRef = useRef(false);

  // Section collapsed states — all start collapsed
  const [timeOpen, setTimeOpen] = useState(false);
  const [repetitionOpen, setRepetitionOpen] = useState(false);
  const [locationOpen, setLocationOpen] = useState(false);
  const [colorOpen, setColorOpen] = useState(false);

  /** Populate all form fields from a CalendarEvent. */
  const populateForm = (ev: CalendarEvent) => {
    setName(ev.name ?? '');
    setStartStr(msToDatetimeLocal(ev.start));
    setEndStr(msToDatetimeLocal(ev.end));
    setDuration(ev.eachTileDuration != null ? String(Math.round(ev.eachTileDuration / 60000)) : '');
    setAddress(ev.address ?? '');
    setAddressDescription(ev.addressDescription ?? '');
    const r = ev.colorRed ?? 0;
    const g = ev.colorGreen ?? 0;
    const b = ev.colorBlue ?? 0;
    const match = COLOR_SWATCHES.findIndex((s) => s.r === r && s.g === g && s.b === b);
    setSelectedColor(match >= 0 ? match : 0);
    setIsRecurring(ev.repetition?.isEnabled ?? false);
    setFrequency(ev.repetition?.frequency ?? '');
    setIsForever(ev.repetition?.isForever ?? false);
    setRepetitionStartStr(msToDatetimeLocal(ev.repetition?.repetitionTimeline?.start ?? null));
    setRepetitionEndStr(msToDatetimeLocal(ev.repetition?.repetitionTimeline?.end ?? null));
    const wd = ev.repetition?.weekDays;
    setWeekDays(wd ? new Set(wd.split(',').map((s) => s.trim())) : new Set<string>());
  };

  // Debounced location search — only when the user types in the input
  useEffect(() => {
    if (!userEditedAddressRef.current) return;
    userEditedAddressRef.current = false;
    if (!address.trim()) {
      setLocationResults([]);
      setShowLocationDropdown(false);
      setIsSearching(false);
      return;
    }
    setIsSearching(true);
    const timer = setTimeout(async () => {
      try {
        const results = await scheduleService.searchLocations(address);
        setLocationResults(results);
        setShowLocationDropdown(results.length > 0);
      } catch {
        setLocationResults([]);
        setShowLocationDropdown(false);
      } finally {
        setIsSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [address]);

  const handleSelectLocation = (loc: ScheduleSubCalendarEventLocation) => {
    setAddress(loc.address);
    setAddressDescription(loc.description);
    setShowLocationDropdown(false);
    setLocationResults([]);
  };

  // Fetch full event details on mount
  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    scheduleService.lookupCalendarEventById(event.id)
      .then(async (full) => {
        if (cancelled) return;
        populateForm(full);
        // Fetch full location details if the event has a locationId
        if (full.locationId) {
          try {
            const location = await scheduleService.lookupLocationById(full.locationId);
            if (!cancelled) {
              setAddress(location.address ?? '');
              setAddressDescription(location.description ?? '');
            }
          } catch (locErr) {
            console.error('Fetch location failed:', locErr);
          }
        }
      })
      .catch((err) => {
        console.error('Fetch event failed:', err);
        // Fall back to prop data on failure
        if (!cancelled) populateForm(event);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => { cancelled = true; };
  }, [event.id]);

  const handleSave = async () => {
    if (!event.id) return;
    setIsSaving(true);

    const startMs = datetimeLocalToMs(startStr);
    const endMs = datetimeLocalToMs(endStr);
    const swatch = COLOR_SWATCHES[selectedColor];

    const params: CalendarEventUpdateParams = {
      EventID: event.id,
      EventName: name,
      Start: startMs ?? undefined,
      End: endMs ?? undefined,
      Duration: duration ? Number(duration) * 60000 : undefined,
      CalAddress: address || undefined,
      CalAddressDescription: addressDescription || undefined,
      ColorConfig: {
        IsEnabled: true,
        Red: String(swatch.r),
        Green: String(swatch.g),
        Blue: String(swatch.b),
        Opacity: String(event.colorOpacity ?? 1),
      },
      MobileApp: true,
      Version: 'v2',
    };

    if (isRecurring && frequency) {
      params.RepetitionConfig = {
        IsEnabled: true,
        Frequency: frequency,
        IsForever: isForever,
        RepetitionStart: datetimeLocalToMs(repetitionStartStr) ?? undefined,
        RepetitionEnd: datetimeLocalToMs(repetitionEndStr) ?? undefined,
        DayOfWeekRepetitions: frequency === 'weekly' ? Array.from(weekDays) : undefined,
      };
    }

    const notifId = notificationId(NotificationAction.Update, event.id);
    showNotification(notifId, t('calendarEvent.edit.saving'), 'loading');

    try {
      await scheduleService.updateCalendarEvent(params);
      updateNotification(notifId, t('calendarEvent.edit.saveSuccess'), 'success');
      onClose();
    } catch (error) {
      console.error('Update failed:', error);
      updateNotification(notifId, t('calendarEvent.edit.saveFailed'), 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Container>
      <Header>
        <BackButton onClick={onClose} aria-label={t('calendarEvent.edit.back')}>
          <ArrowLeft size={18} />
        </BackButton>
        <Title>{t('calendarEvent.edit.title')}</Title>
      </Header>

      {isLoading && <LoadingText>{t('calendarEvent.edit.loading')}</LoadingText>}

      {!isLoading && (
      <Form>
        {/* Name */}
        <FieldGroup>
          <Label>{t('calendarEvent.edit.name')}</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </FieldGroup>

        {/* Time & Duration Section */}
        <Section>
          <SectionHeader onClick={() => setTimeOpen((v) => !v)}>
            <SectionTitle>{t('calendarEvent.edit.timeSection')}</SectionTitle>
            <Chevron $open={timeOpen}><ChevronDown size={16} /></Chevron>
          </SectionHeader>
          {timeOpen && (
            <SectionBody>
              <FieldGroup>
                <Label>{t('calendarEvent.edit.start')}</Label>
                <Input type="datetime-local" value={startStr} onChange={(e) => setStartStr(e.target.value)} />
              </FieldGroup>
              <FieldGroup>
                <Label>{t('calendarEvent.edit.end')}</Label>
                <Input type="datetime-local" value={endStr} onChange={(e) => setEndStr(e.target.value)} />
              </FieldGroup>
              <FieldGroup>
                <Label>{t('calendarEvent.edit.duration')}</Label>
                <Input
                  type="number"
                  min="0"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder={t('calendarEvent.edit.durationPlaceholder')}
                />
              </FieldGroup>
            </SectionBody>
          )}
        </Section>

        {/* Repetition Section */}
        <Section>
          <SectionHeader onClick={() => setRepetitionOpen((v) => !v)}>
            <SectionTitle>{t('calendarEvent.edit.repetitionSection')}</SectionTitle>
            {!repetitionOpen && isRecurring && frequency && (
              <PreviewText>{frequency}</PreviewText>
            )}
            <Chevron $open={repetitionOpen}><ChevronDown size={16} /></Chevron>
          </SectionHeader>
          {repetitionOpen && (
            <SectionBody>
              <FieldGroup>
                <RecurrenceToggle>
                  <CheckboxInput
                    type="checkbox"
                    checked={isRecurring}
                    onChange={(e) => setIsRecurring(e.target.checked)}
                  />
                  <Label as="span">{t('calendarEvent.edit.recurring')}</Label>
                </RecurrenceToggle>
                {isRecurring && (
                  <Select value={frequency} onChange={(e) => setFrequency(e.target.value)}>
                    <option value="">{t('calendarEvent.edit.selectFrequency')}</option>
                    <option value="daily">{t('calendarEvent.edit.daily')}</option>
                    <option value="weekly">{t('calendarEvent.edit.weekly')}</option>
                    <option value="monthly">{t('calendarEvent.edit.monthly')}</option>
                    <option value="yearly">{t('calendarEvent.edit.yearly')}</option>
                  </Select>
                )}
              </FieldGroup>
              {isRecurring && (
                <FieldGroup>
                  <RecurrenceToggle>
                    <CheckboxInput
                      type="checkbox"
                      id="forever-checkbox"
                      checked={isForever}
                      onChange={(e) => setIsForever(e.target.checked)}
                      aria-label={t('calendarEvent.edit.forever')}
                    />
                    <Label as="span" htmlFor="forever-checkbox">{t('calendarEvent.edit.forever')}</Label>
                  </RecurrenceToggle>
                </FieldGroup>
              )}
              {isRecurring && !isForever && (
                <>
                  <FieldGroup>
                    <Label htmlFor="rep-start">{t('calendarEvent.edit.repetitionStart')}</Label>
                    <Input
                      id="rep-start"
                      type="datetime-local"
                      value={repetitionStartStr}
                      onChange={(e) => setRepetitionStartStr(e.target.value)}
                    />
                  </FieldGroup>
                  <FieldGroup>
                    <Label htmlFor="rep-end">{t('calendarEvent.edit.repetitionEnd')}</Label>
                    <Input
                      id="rep-end"
                      type="datetime-local"
                      value={repetitionEndStr}
                      onChange={(e) => setRepetitionEndStr(e.target.value)}
                    />
                  </FieldGroup>
                </>
              )}
              {isRecurring && frequency === 'weekly' && (
                <WeekDayRow>
                  {(['0', '1', '2', '3', '4', '5', '6'] as const).map((dayIdx) => {
                    const dayKey = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][Number(dayIdx)];
                    return (
                      <WeekDayChip
                        key={dayIdx}
                        $selected={weekDays.has(dayIdx)}
                        onClick={() => {
                          setWeekDays((prev) => {
                            const next = new Set(prev);
                            if (next.has(dayIdx)) next.delete(dayIdx);
                            else next.add(dayIdx);
                            return next;
                          });
                        }}
                        aria-label={t(`calendarEvent.edit.${dayKey}`)}
                        role="checkbox"
                        aria-checked={weekDays.has(dayIdx)}
                      >
                        {t(`calendarEvent.edit.${dayKey}`)}
                      </WeekDayChip>
                    );
                  })}
                </WeekDayRow>
              )}
            </SectionBody>
          )}
        </Section>

        {/* Location Section */}
        <Section>
          <SectionHeader onClick={() => setLocationOpen((v) => !v)}>
            <SectionTitle>{t('calendarEvent.edit.locationSection')}</SectionTitle>
            {!locationOpen && (address || addressDescription) && (
              <PreviewText>{[address, addressDescription].filter(Boolean).join(' · ')}</PreviewText>
            )}
            <Chevron $open={locationOpen}><ChevronDown size={16} /></Chevron>
          </SectionHeader>
          {locationOpen && (
            <SectionBody>
              <FieldGroup>
                <Label>{t('calendarEvent.edit.location')}</Label>
                <AutocompleteWrapper>
                  <Input
                    value={address}
                    onChange={(e) => { userEditedAddressRef.current = true; setAddress(e.target.value); }}
                    placeholder={t('calendarEvent.edit.locationSearchPlaceholder')}
                    onFocus={() => { if (locationResults.length > 0) setShowLocationDropdown(true); }}
                  />
                  {isSearching && (
                    <SearchingIndicator role="status">
                      <Loader2 size={16} className="spin" />
                    </SearchingIndicator>
                  )}
                  {!isSearching && showLocationDropdown && locationResults.length > 0 && (
                    <Dropdown>
                      {(() => {
                        const saved = locationResults.filter((l) => l.source !== 'google');
                        const google = locationResults.filter((l) => l.source === 'google');
                        return (
                          <>
                            {saved.map((loc) => (
                              <DropdownItem key={loc.id} onClick={() => handleSelectLocation(loc)}>
                                <ItemIcon aria-label="saved"><Bookmark size={14} /></ItemIcon>
                                <DropdownItemText>
                                  <DropdownItemAddress>{loc.address}</DropdownItemAddress>
                                  {loc.description && loc.description !== loc.id && (
                                    <DropdownItemDesc>{loc.description}</DropdownItemDesc>
                                  )}
                                </DropdownItemText>
                              </DropdownItem>
                            ))}
                            {google.map((loc) => (
                              <DropdownItem key={loc.id} onClick={() => handleSelectLocation(loc)}>
                                <ItemIcon aria-label="google"><MapPin size={14} /></ItemIcon>
                                <DropdownItemText>
                                  <DropdownItemAddress>{loc.address}</DropdownItemAddress>
                                  {loc.description && (
                                    <DropdownItemDesc>{loc.description}</DropdownItemDesc>
                                  )}
                                </DropdownItemText>
                              </DropdownItem>
                            ))}
                            {google.length > 0 && (
                              <PoweredByGoogle>{t('calendarEvent.edit.poweredByGoogle')}</PoweredByGoogle>
                            )}
                          </>
                        );
                      })()}
                    </Dropdown>
                  )}
                </AutocompleteWrapper>
              </FieldGroup>
              <FieldGroup>
                <Label>{t('calendarEvent.edit.locationDescription')}</Label>
                <Input
                  value={addressDescription}
                  onChange={(e) => setAddressDescription(e.target.value)}
                  placeholder={t('calendarEvent.edit.locationDescriptionPlaceholder')}
                />
              </FieldGroup>
            </SectionBody>
          )}
        </Section>

        {/* Color Section */}
        <Section>
          <SectionHeader onClick={() => setColorOpen((v) => !v)}>
            <SectionTitle>{t('calendarEvent.edit.colorSection')}</SectionTitle>
            <SwatchPreview
              style={{ backgroundColor: `rgb(${COLOR_SWATCHES[selectedColor].r}, ${COLOR_SWATCHES[selectedColor].g}, ${COLOR_SWATCHES[selectedColor].b})` }}
            />
            <Chevron $open={colorOpen}><ChevronDown size={16} /></Chevron>
          </SectionHeader>
          {colorOpen && (
            <SectionBody>
              <SwatchGrid>
                {COLOR_SWATCHES.map((swatch, i) => (
                  <Swatch
                    key={i}
                    style={{ backgroundColor: `rgb(${swatch.r}, ${swatch.g}, ${swatch.b})` }}
                    $selected={i === selectedColor}
                    onClick={() => setSelectedColor(i)}
                    aria-label={`Color ${i + 1}`}
                  />
                ))}
              </SwatchGrid>
            </SectionBody>
          )}
        </Section>

        <SaveButton onClick={handleSave} disabled={isSaving || !name.trim()}>
          {isSaving ? <Loader2 size={16} className="spin" /> : <Save size={16} />}
          {t('calendarEvent.edit.save')}
        </SaveButton>
      </Form>
      )}
    </Container>
  );
};

export default EditCalendarEvent;

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow-y: auto;
  padding: 1rem;
`;

const LoadingText = styled.p`
  text-align: center;
  padding: 1rem 0;
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 0.875rem;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1.25rem;
`;

const BackButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  background: transparent;
  color: ${({ theme }) => theme.colors.text.secondary};
  cursor: pointer;
  transition: background 0.15s ease;

  &:hover {
    background: ${({ theme }) => theme.colors.background.card2};
    color: ${({ theme }) => theme.colors.text.primary};
  }
`;

const Title = styled.h2`
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text.primary};
  margin: 0;
`;

const Form = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

/* ── Collapsible Section ── */

const Section = styled.div`
  border: 1px solid ${({ theme }) => theme.colors.border.default};
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  overflow: hidden;
`;

const SectionHeader = styled.button`
  display: flex;
  align-items: center;
  width: 100%;
  padding: 0.625rem 0.75rem;
  border: none;
  background: ${({ theme }) => theme.colors.background.card2};
  color: ${({ theme }) => theme.colors.text.primary};
  cursor: pointer;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: 600;
  gap: 0.5rem;
  text-align: left;

  &:hover {
    background: ${({ theme }) => theme.colors.background.card};
  }
`;

const SectionTitle = styled.span`
  flex-shrink: 0;
`;

const PreviewText = styled.span`
  flex: 1;
  font-weight: 400;
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.text.muted};
  text-align: right;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const Chevron = styled.span<{ $open: boolean }>`
  display: flex;
  align-items: center;
  color: ${({ theme }) => theme.colors.text.muted};
  transition: transform 0.2s ease;
  ${({ $open }) =>
    $open &&
    css`
      transform: rotate(180deg);
    `}
`;

const SectionBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 0.75rem;
  border-top: 1px solid ${({ theme }) => theme.colors.border.default};
`;

/* ── Form Primitives ── */

const FieldGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const Label = styled.label`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.text.secondary};
  font-weight: 500;
`;

const Input = styled.input`
  width: 100%;
  height: 36px;
  padding: 0 0.75rem;
  border: 1px solid ${({ theme }) => theme.colors.input.border};
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  background-color: ${({ theme }) => theme.colors.input.bg};
  color: ${({ theme }) => theme.colors.input.text};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  outline: none;
  transition: border-color 0.15s ease;

  &::placeholder {
    color: ${({ theme }) => theme.colors.input.placeholder};
  }

  &:hover {
    border-color: ${({ theme }) => theme.colors.input.borderHover};
  }

  &:focus {
    border-color: ${({ theme }) => theme.colors.input.focusRing};
  }
`;


const Select = styled.select`
  width: 100%;
  height: 36px;
  padding: 0 0.75rem;
  border: 1px solid ${({ theme }) => theme.colors.input.border};
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  background-color: ${({ theme }) => theme.colors.input.bg};
  color: ${({ theme }) => theme.colors.input.text};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  outline: none;
  cursor: pointer;

  &:hover {
    border-color: ${({ theme }) => theme.colors.input.borderHover};
  }

  &:focus {
    border-color: ${({ theme }) => theme.colors.input.focusRing};
  }
`;

const RecurrenceToggle = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const CheckboxInput = styled.input`
  width: 16px;
  height: 16px;
  accent-color: ${({ theme }) => theme.colors.brand[500]};
  cursor: pointer;
`;

const WeekDayRow = styled.div`
  display: flex;
  gap: 0.375rem;
  flex-wrap: wrap;
`;

const WeekDayChip = styled.button<{ $selected: boolean }>`
  padding: 0.25rem 0.5rem;
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  border: 1px solid ${({ $selected, theme }) => ($selected ? theme.colors.brand[500] : theme.colors.border.default)};
  background: ${({ $selected, theme }) => ($selected ? theme.colors.brand[500] : 'transparent')};
  color: ${({ $selected, theme }) => ($selected ? '#fff' : theme.colors.text.primary)};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  cursor: pointer;
  transition: all 0.15s ease;
`;

/* ── Location Autocomplete ── */

const AutocompleteWrapper = styled.div``;

const SearchingIndicator = styled.div`
  display: flex;
  justify-content: center;
  padding: 0.75rem;
  color: ${({ theme }) => theme.colors.text.muted};

  .spin {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

const Dropdown = styled.div`
  max-height: 240px;
  overflow-y: auto;
  border: 1px solid ${({ theme }) => theme.colors.border.default};
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  background: ${({ theme }) => theme.colors.background.card};
  margin-top: 4px;
`;

const DropdownItem = styled.button`
  display: flex;
  align-items: flex-start;
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: none;
  background: transparent;
  text-align: left;
  cursor: pointer;
  gap: 0.5rem;

  &:hover {
    background: ${({ theme }) => theme.colors.background.card2};
  }

  &:not(:last-child) {
    border-bottom: 1px solid ${({ theme }) => theme.colors.border.default};
  }
`;

const ItemIcon = styled.span`
  display: flex;
  align-items: center;
  flex-shrink: 0;
  margin-top: 2px;
  color: ${({ theme }) => theme.colors.text.muted};
`;

const DropdownItemText = styled.span`
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  min-width: 0;
`;

const DropdownItemAddress = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.text.primary};
`;

const DropdownItemDesc = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.text.muted};
`;

const PoweredByGoogle = styled.div`
  padding: 0.375rem 0.75rem;
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.text.muted};
  text-align: right;
  font-style: italic;
  border-top: 1px solid ${({ theme }) => theme.colors.border.default};
`;

/* ── Color Swatches ── */

const SwatchPreview = styled.div`
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 1px solid ${({ theme }) => theme.colors.border.default};
  flex-shrink: 0;
`;

const SwatchGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 0.5rem;
`;

const Swatch = styled.button<{ $selected: boolean }>`
  width: 100%;
  aspect-ratio: 1;
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  border: 2px solid ${({ $selected, theme }) => ($selected ? theme.colors.text.primary : 'transparent')};
  cursor: pointer;
  transition: border-color 0.15s ease, transform 0.1s ease;
  outline: none;

  &:hover {
    transform: scale(1.1);
  }
`;

/* ── Save ── */

const SaveButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  height: 40px;
  margin-top: 0.5rem;
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  background: ${({ theme }) => theme.colors.brand[500]};
  color: white;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.15s ease;

  &:hover:not(:disabled) {
    opacity: 0.9;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .spin {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;
