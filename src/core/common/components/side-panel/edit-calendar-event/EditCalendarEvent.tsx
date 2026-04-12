import React, { useState, useEffect, useRef } from 'react';
import styled, { css } from 'styled-components';
import dayjs from 'dayjs';
import {
	ArrowLeft,
	Save,
	Loader2,
	ChevronRight,
	Bookmark,
	MapPin,
	Calendar,
	X,
	CheckCircle2,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
	CalendarEvent,
	CalendarEventUpdateParams,
	EventLocation,
} from '@/core/common/types/schedule';
import { scheduleService } from '@/services';
import { useUiStore, notificationId, NotificationAction } from '@/core/ui';
import CalendarDatePicker from '@/core/common/components/calendar/calendar_date_picker';
import TimeDropdown from '@/core/common/components/TimeDropdown';
import {
	epochToDate,
	epochToTimeString,
	combineDateAndTimeString,
} from '@/core/common/utils/timeUtils';

const COLOR_SWATCHES: { r: number; g: number; b: number }[] = [
	{ r: 237, g: 18, b: 59 }, // brand red
	{ r: 240, g: 61, b: 95 }, // brand light red
	{ r: 52, g: 152, b: 219 }, // blue
	{ r: 46, g: 204, b: 113 }, // green
	{ r: 155, g: 89, b: 182 }, // purple
	{ r: 241, g: 196, b: 15 }, // yellow
	{ r: 230, g: 126, b: 34 }, // orange
	{ r: 26, g: 188, b: 156 }, // teal
	{ r: 52, g: 73, b: 94 }, // dark blue-gray
	{ r: 149, g: 165, b: 166 }, // silver
	{ r: 192, g: 57, b: 43 }, // dark red
	{ r: 44, g: 62, b: 80 }, // midnight
];

interface EditCalendarEventProps {
	event: CalendarEvent;
	onClose: () => void;
}

const EditCalendarEvent: React.FC<EditCalendarEventProps> = ({ event, onClose }) => {
	const { t } = useTranslation();
	const showNotification = useUiStore((s) => s.notification.show);
	const updateNotification = useUiStore((s) => s.notification.update);

	const [name, setName] = useState(event.name ?? '');
	const [startDate, setStartDate] = useState<dayjs.Dayjs | null>(epochToDate(event.start));
	const [startTime, setStartTime] = useState(epochToTimeString(event.start));
	const [endDate, setEndDate] = useState<dayjs.Dayjs | null>(epochToDate(event.end));
	const [endTime, setEndTime] = useState(epochToTimeString(event.end));
	const [durationHours, setDurationHours] = useState<string>(
		event.eachTileDuration != null ? String(Math.floor(event.eachTileDuration / 3600000)) : ''
	);
	const [durationMinutes, setDurationMinutes] = useState<string>(
		event.eachTileDuration != null
			? String(Math.round((event.eachTileDuration % 3600000) / 60000))
			: ''
	);
	const [splitCount, setSplitCount] = useState<string>(
		event.splitCount != null ? String(event.splitCount) : ''
	);
	const [address, setAddress] = useState(event.address ?? '');
	const [addressDescription, setAddressDescription] = useState(event.addressDescription ?? '');
	const [locationId, setLocationId] = useState<string | null>(event.locationId ?? null);
	const [isLocationCleared, setIsLocationCleared] = useState(false);
	const [customColor, setCustomColor] = useState<{ r: number; g: number; b: number }>({
		r: event.colorRed ?? 0,
		g: event.colorGreen ?? 0,
		b: event.colorBlue ?? 0,
	});
	const [selectedColor, setSelectedColor] = useState(() => {
		const { r, g, b } = customColor;
		return COLOR_SWATCHES.findIndex((s) => s.r === r && s.g === g && s.b === b);
	});
	const activeColor = selectedColor >= 0 ? COLOR_SWATCHES[selectedColor] : customColor;
	const [isRecurring, setIsRecurring] = useState(event.repetition?.isEnabled ?? false);
	const [frequency, setFrequency] = useState((event.repetition?.frequency ?? '').toLowerCase());
	const [isForever, setIsForever] = useState(event.repetition?.isForever ?? false);
	const [repStartDate, setRepStartDate] = useState<dayjs.Dayjs | null>(
		epochToDate(event.repetition?.repetitionTimeline?.start ?? null)
	);
	const [repStartTime, setRepStartTime] = useState(
		epochToTimeString(event.repetition?.repetitionTimeline?.start ?? null)
	);
	const [repEndDate, setRepEndDate] = useState<dayjs.Dayjs | null>(
		epochToDate(event.repetition?.repetitionTimeline?.end ?? null)
	);
	const [repEndTime, setRepEndTime] = useState(
		epochToTimeString(event.repetition?.repetitionTimeline?.end ?? null)
	);
	const [weekDays, setWeekDays] = useState<Set<string>>(() => {
		const wd = event.repetition?.weekDays;
		return wd ? new Set(wd.split(',').map((s) => s.trim())) : new Set<string>();
	});
	const [isSaving, setIsSaving] = useState(false);
	const [isLoading, setIsLoading] = useState(true);
	const [locationResults, setLocationResults] = useState<EventLocation[]>([]);
	const [showLocationDropdown, setShowLocationDropdown] = useState(false);
	const [isSearching, setIsSearching] = useState(false);
	const [isLocationVerified, setIsLocationVerified] = useState(false);
	const userEditedAddressRef = useRef(false);

	// Snapshot of form values after loading, used to detect changes
	const initialFormRef = useRef<Record<string, string> | null>(null);

	// Section collapsed states — all start collapsed
	const [timeOpen, setTimeOpen] = useState(false);
	const [repetitionOpen, setRepetitionOpen] = useState(false);
	const [locationOpen, setLocationOpen] = useState(false);
	const [colorOpen, setColorOpen] = useState(false);

	// Date picker open states
	const [startPickerOpen, setStartPickerOpen] = useState(false);
	const [endPickerOpen, setEndPickerOpen] = useState(false);
	const [repStartPickerOpen, setRepStartPickerOpen] = useState(false);
	const [repEndPickerOpen, setRepEndPickerOpen] = useState(false);

	const closeAllPickers = () => {
		setStartPickerOpen(false);
		setEndPickerOpen(false);
		setRepStartPickerOpen(false);
		setRepEndPickerOpen(false);
	};

	/** Populate all form fields from a CalendarEvent. */
	const populateForm = (ev: CalendarEvent) => {
		setName(ev.name ?? '');
		setStartDate(epochToDate(ev.start));
		setStartTime(epochToTimeString(ev.start));
		setEndDate(epochToDate(ev.end));
		setEndTime(epochToTimeString(ev.end));
		setEndDate(epochToDate(ev.end));
		setEndTime(epochToTimeString(ev.end));
		setDurationHours(
			ev.eachTileDuration != null ? String(Math.floor(ev.eachTileDuration / 3600000)) : ''
		);
		setDurationMinutes(
			ev.eachTileDuration != null
				? String(Math.round((ev.eachTileDuration % 3600000) / 60000))
				: ''
		);
		setSplitCount(ev.splitCount != null ? String(ev.splitCount) : '');
		setAddress(ev.address ?? '');
		setAddressDescription(ev.addressDescription ?? '');
		setLocationId(ev.locationId ?? null);
		setIsLocationCleared(false);
		const r = ev.colorRed ?? 0;
		const g = ev.colorGreen ?? 0;
		const b = ev.colorBlue ?? 0;
		setCustomColor({ r, g, b });
		const match = COLOR_SWATCHES.findIndex((s) => s.r === r && s.g === g && s.b === b);
		setSelectedColor(match);
		setIsRecurring(ev.repetition?.isEnabled ?? false);
		setFrequency((ev.repetition?.frequency ?? '').toLowerCase());
		setIsForever(ev.repetition?.isForever ?? false);
		setRepStartDate(epochToDate(ev.repetition?.repetitionTimeline?.start ?? null));
		setRepStartTime(epochToTimeString(ev.repetition?.repetitionTimeline?.start ?? null));
		setRepEndDate(epochToDate(ev.repetition?.repetitionTimeline?.end ?? null));
		setRepEndTime(epochToTimeString(ev.repetition?.repetitionTimeline?.end ?? null));
		const wd = ev.repetition?.weekDays;
		setWeekDays(wd ? new Set(wd.split(',').map((s) => s.trim())) : new Set<string>());
	};

	const snapshotForm = () => {
		initialFormRef.current = {
			name,
			startDate: startDate?.valueOf()?.toString() ?? '',
			startTime,
			endDate: endDate?.valueOf()?.toString() ?? '',
			endTime,
			durationHours,
			durationMinutes,
			splitCount,
			address,
			addressDescription,
			locationId: locationId ?? '',
			isLocationCleared: String(isLocationCleared),
			selectedColor: String(selectedColor),
			isRecurring: String(isRecurring),
			frequency,
			isForever: String(isForever),
			repStartDate: repStartDate?.valueOf()?.toString() ?? '',
			repStartTime,
			repEndDate: repEndDate?.valueOf()?.toString() ?? '',
			repEndTime,
			weekDays: Array.from(weekDays).sort().join(','),
		};
	};

	const isDirty = (() => {
		const init = initialFormRef.current;
		if (!init) return false;
		const current: Record<string, string> = {
			name,
			startDate: startDate?.valueOf()?.toString() ?? '',
			startTime,
			endDate: endDate?.valueOf()?.toString() ?? '',
			endTime,
			durationHours,
			durationMinutes,
			splitCount,
			address,
			addressDescription,
			locationId: locationId ?? '',
			isLocationCleared: String(isLocationCleared),
			selectedColor: String(selectedColor),
			isRecurring: String(isRecurring),
			frequency,
			isForever: String(isForever),
			repStartDate: repStartDate?.valueOf()?.toString() ?? '',
			repStartTime,
			repEndDate: repEndDate?.valueOf()?.toString() ?? '',
			repEndTime,
			weekDays: Array.from(weekDays).sort().join(','),
		};
		return Object.keys(init).some((k) => init[k] !== current[k]);
	})();

	// Debounced location search — only when the user types in the input
	useEffect(() => {
		if (!userEditedAddressRef.current) return;
		userEditedAddressRef.current = false;
		if (address.trim().length < 3) {
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

	const handleSelectLocation = (loc: EventLocation) => {
		setAddress(loc.address);
		setAddressDescription(loc.description);
		setLocationId(loc.source !== 'google' ? loc.id : null);
		setIsLocationCleared(false);
		setIsLocationVerified(loc.isVerified);
		setShowLocationDropdown(false);
		setLocationResults([]);
	};

	const handleClearLocation = () => {
		setAddress('');
		setAddressDescription('');
		setLocationId(null);
		setIsLocationCleared(true);
		setIsLocationVerified(false);
		setLocationResults([]);
		setShowLocationDropdown(false);
	};

	// Fetch full event details on mount
	useEffect(() => {
		let cancelled = false;
		setIsLoading(true);
		if (!event.id) return;
		scheduleService
			.lookupCalendarEventById(event.id)
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
							setIsLocationVerified(location.isVerified ?? false);
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
		return () => {
			cancelled = true;
		};
	}, [event.id]);

	// Snapshot form values once loading finishes
	useEffect(() => {
		if (!isLoading && !initialFormRef.current) {
			snapshotForm();
		}
	});

	const handleSave = async () => {
		if (!event.id) return;
		setIsSaving(true);

		const startMs = combineDateAndTimeString(startDate, startTime);
		const endMs = combineDateAndTimeString(endDate, endTime);
		const swatch = activeColor;

		const params: CalendarEventUpdateParams = {
			EventID: event.id,
			EventName: name,
			Start: startMs ?? undefined,
			End: endMs ?? undefined,
			Duration:
				durationHours || durationMinutes
					? Number(durationHours || 0) * 3600000 + Number(durationMinutes || 0) * 60000
					: undefined,
			Split: splitCount ? Number(splitCount) : undefined,
			LocationId: locationId || undefined,
			IsLocationCleared: isLocationCleared ? 'true' : undefined,
			CalAddress: !locationId && (address || addressDescription) ? address : undefined,
			CalAddressDescription:
				!locationId && (address || addressDescription) ? addressDescription : undefined,
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
				RepetitionStart: combineDateAndTimeString(repStartDate, repStartTime) ?? undefined,
				RepetitionEnd: combineDateAndTimeString(repEndDate, repEndTime) ?? undefined,
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
				<Title>
					{t(
						event.isRigid === true
							? 'calendarEvent.edit.titleBlock'
							: event.isRigid === false
								? 'calendarEvent.edit.titleTile'
								: 'calendarEvent.edit.title'
					)}
				</Title>
			</Header>

			{isLoading && (
				<LoadingContainer data-testid="edit-event-loading">
					<Spinner size={24} />
					<LoadingText>
						{t(
							event.isRigid === true
								? 'calendarEvent.edit.loadingBlock'
								: event.isRigid === false
									? 'calendarEvent.edit.loadingTile'
									: 'calendarEvent.edit.loading'
						)}
					</LoadingText>
				</LoadingContainer>
			)}

			{!isLoading && (
				<>
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
								<Chevron $open={timeOpen}>
									<ChevronRight size={16} />
								</Chevron>
								{!timeOpen &&
									(startDate || endDate || durationHours || durationMinutes) && (
										<PreviewText>
											{[
												startDate &&
													`${startDate.format('MMM D')} ${startTime}`,
												endDate && `${endDate.format('MMM D')} ${endTime}`,
												(durationHours || durationMinutes) &&
													[
														durationHours &&
															Number(durationHours) > 0 &&
															t(
																'calendarEvent.edit.durationHoursPreview',
																{ count: Number(durationHours) }
															),
														durationMinutes &&
															Number(durationMinutes) > 0 &&
															t(
																'calendarEvent.edit.durationMinutesPreview',
																{ count: Number(durationMinutes) }
															),
													]
														.filter(Boolean)
														.join(' '),
											]
												.filter(Boolean)
												.join(' \u00b7 ')}
										</PreviewText>
									)}
							</SectionHeader>
							{timeOpen && (
								<SectionBody>
									<FieldGroup>
										<Label>{t('calendarEvent.edit.start')}</Label>
										<DateTimeRow>
											<DatePickerWrapper>
												<DateTrigger
													onClick={() => {
														closeAllPickers();
														setStartPickerOpen((v) => !v);
													}}
													type="button"
												>
													<Calendar size={14} />
													{startDate
														? startDate.format('MMM D, YYYY')
														: t('calendarEvent.edit.selectDate')}
												</DateTrigger>
												<CalendarDatePicker
													isOpen={startPickerOpen}
													onClose={() => setStartPickerOpen(false)}
													onDateSelect={(d) => {
														setStartDate(d);
														setStartPickerOpen(false);
													}}
													selectedDate={startDate ?? undefined}
												/>
											</DatePickerWrapper>
											<TimeDropdown
												value={startTime}
												onChange={setStartTime}
												interval={15}
											/>
										</DateTimeRow>
									</FieldGroup>
									<FieldGroup>
										<Label>{t('calendarEvent.edit.end')}</Label>
										<DateTimeRow>
											<DatePickerWrapper>
												<DateTrigger
													onClick={() => {
														closeAllPickers();
														setEndPickerOpen((v) => !v);
													}}
													type="button"
												>
													<Calendar size={14} />
													{endDate
														? endDate.format('MMM D, YYYY')
														: t('calendarEvent.edit.selectDate')}
												</DateTrigger>
												<CalendarDatePicker
													isOpen={endPickerOpen}
													onClose={() => setEndPickerOpen(false)}
													onDateSelect={(d) => {
														setEndDate(d);
														setEndPickerOpen(false);
													}}
													selectedDate={endDate ?? undefined}
												/>
											</DatePickerWrapper>
											<TimeDropdown
												value={endTime}
												onChange={setEndTime}
												interval={15}
											/>
										</DateTimeRow>
									</FieldGroup>
									<FieldGroup>
										<Label>{t('calendarEvent.edit.duration')}</Label>
										<DurationRow>
											<DurationField>
												<Input
													type="number"
													min="0"
													value={durationHours}
													onChange={(e) =>
														setDurationHours(e.target.value)
													}
													placeholder="0"
												/>
												<DurationUnit>
													{t('calendarEvent.edit.hours')}
												</DurationUnit>
											</DurationField>
											<DurationField>
												<Input
													type="number"
													min="0"
													max="59"
													value={durationMinutes}
													onChange={(e) =>
														setDurationMinutes(e.target.value)
													}
													placeholder="0"
												/>
												<DurationUnit>
													{t('calendarEvent.edit.minutes')}
												</DurationUnit>
											</DurationField>
										</DurationRow>
									</FieldGroup>
									<FieldGroup>
										<Label>{t('calendarEvent.edit.split')}</Label>
										<Input
											type="number"
											min="1"
											value={splitCount}
											onChange={(e) => setSplitCount(e.target.value)}
											placeholder={t('calendarEvent.edit.splitPlaceholder')}
										/>
									</FieldGroup>
								</SectionBody>
							)}
						</Section>

						{/* Repetition Section */}
						<Section>
							<SectionHeader onClick={() => setRepetitionOpen((v) => !v)}>
								<SectionTitle>
									{t('calendarEvent.edit.repetitionSection')}
								</SectionTitle>
								<Chevron $open={repetitionOpen}>
									<ChevronRight size={16} />
								</Chevron>
								{!repetitionOpen && isRecurring && frequency && (
									<PreviewText>{frequency}</PreviewText>
								)}
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
											<Label as="span">
												{t('calendarEvent.edit.recurring')}
											</Label>
										</RecurrenceToggle>
										{isRecurring && (
											<Select
												value={frequency}
												onChange={(e) => setFrequency(e.target.value)}
											>
												<option value="">
													{t('calendarEvent.edit.selectFrequency')}
												</option>
												<option value="daily">
													{t('calendarEvent.edit.daily')}
												</option>
												<option value="weekly">
													{t('calendarEvent.edit.weekly')}
												</option>
												<option value="monthly">
													{t('calendarEvent.edit.monthly')}
												</option>
												<option value="yearly">
													{t('calendarEvent.edit.yearly')}
												</option>
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
												<Label as="span" htmlFor="forever-checkbox">
													{t('calendarEvent.edit.forever')}
												</Label>
											</RecurrenceToggle>
										</FieldGroup>
									)}
									{isRecurring && !isForever && (
										<>
											<FieldGroup>
												<Label>
													{t('calendarEvent.edit.repetitionStart')}
												</Label>
												<DateTimeRow>
													<DatePickerWrapper>
														<DateTrigger
															onClick={() => {
																closeAllPickers();
																setRepStartPickerOpen((v) => !v);
															}}
															type="button"
															aria-label={t(
																'calendarEvent.edit.repetitionStart'
															)}
														>
															<Calendar size={14} />
															{repStartDate
																? repStartDate.format('MMM D, YYYY')
																: t(
																		'calendarEvent.edit.selectDate'
																	)}
														</DateTrigger>
														<CalendarDatePicker
															isOpen={repStartPickerOpen}
															onClose={() =>
																setRepStartPickerOpen(false)
															}
															onDateSelect={(d) => {
																setRepStartDate(d);
																setRepStartPickerOpen(false);
															}}
															selectedDate={repStartDate ?? undefined}
														/>
													</DatePickerWrapper>
													<TimeDropdown
														value={repStartTime}
														onChange={setRepStartTime}
														interval={15}
													/>
												</DateTimeRow>
											</FieldGroup>
											<FieldGroup>
												<Label>
													{t('calendarEvent.edit.repetitionEnd')}
												</Label>
												<DateTimeRow>
													<DatePickerWrapper>
														<DateTrigger
															onClick={() => {
																closeAllPickers();
																setRepEndPickerOpen((v) => !v);
															}}
															type="button"
															aria-label={t(
																'calendarEvent.edit.repetitionEnd'
															)}
														>
															<Calendar size={14} />
															{repEndDate
																? repEndDate.format('MMM D, YYYY')
																: t(
																		'calendarEvent.edit.selectDate'
																	)}
														</DateTrigger>
														<CalendarDatePicker
															isOpen={repEndPickerOpen}
															onClose={() =>
																setRepEndPickerOpen(false)
															}
															onDateSelect={(d) => {
																setRepEndDate(d);
																setRepEndPickerOpen(false);
															}}
															selectedDate={repEndDate ?? undefined}
														/>
													</DatePickerWrapper>
													<TimeDropdown
														value={repEndTime}
														onChange={setRepEndTime}
														interval={15}
													/>
												</DateTimeRow>
											</FieldGroup>
										</>
									)}
									{isRecurring && frequency === 'weekly' && (
										<WeekDayRow>
											{(['0', '1', '2', '3', '4', '5', '6'] as const).map(
												(dayIdx) => {
													const dayKey = [
														'sun',
														'mon',
														'tue',
														'wed',
														'thu',
														'fri',
														'sat',
													][Number(dayIdx)];
													return (
														<WeekDayChip
															key={dayIdx}
															$selected={weekDays.has(dayIdx)}
															onClick={() => {
																setWeekDays((prev) => {
																	const next = new Set(prev);
																	if (next.has(dayIdx))
																		next.delete(dayIdx);
																	else next.add(dayIdx);
																	return next;
																});
															}}
															aria-label={t(
																`calendarEvent.edit.${dayKey}`
															)}
															role="checkbox"
															aria-checked={weekDays.has(dayIdx)}
														>
															{t(`calendarEvent.edit.${dayKey}`)}
														</WeekDayChip>
													);
												}
											)}
										</WeekDayRow>
									)}
								</SectionBody>
							)}
						</Section>

						{/* Location Section */}
						<Section>
							<SectionHeader onClick={() => setLocationOpen((v) => !v)}>
								<SectionTitle>
									{t('calendarEvent.edit.locationSection')}
								</SectionTitle>
								<Chevron $open={locationOpen}>
									<ChevronRight size={16} />
								</Chevron>
								{!locationOpen && (address || addressDescription) && (
									<PreviewText>
										{[address, addressDescription]
											.filter(Boolean)
											.join(' \u00b7 ')}
									</PreviewText>
								)}
							</SectionHeader>
							{locationOpen && (
								<SectionBody>
									<FieldGroup>
										<Label>{t('calendarEvent.edit.location')}</Label>
										<AutocompleteWrapper>
											<InputWithClear>
												<Input
													value={address}
													onChange={(e) => {
														userEditedAddressRef.current = true;
														setLocationId(null);
														setIsLocationCleared(false);
														setIsLocationVerified(false);
														setAddress(e.target.value);
													}}
													placeholder={t(
														'calendarEvent.edit.locationSearchPlaceholder'
													)}
													onFocus={() => {
														if (locationResults.length > 0)
															setShowLocationDropdown(true);
													}}
													onBlur={() => {
														setTimeout(() => setShowLocationDropdown(false), 150);
													}}
												/>
												{(address || addressDescription) && (
													<ClearButton
														type="button"
														onClick={handleClearLocation}
														aria-label={t(
															'calendarEvent.edit.clearLocation'
														)}
													>
														<X size={14} />
													</ClearButton>
												)}
											</InputWithClear>
											{isLocationVerified && address && (
												<VerifiedBadge
													data-testid="location-verified-badge"
													title={t('location.verified.tooltip')}
												>
													<CheckCircle2 size={12} />
													{t('location.verified.label')}
												</VerifiedBadge>
											)}
											{address.trim().length > 0 &&
												address.trim().length < 3 && (
													<HintText>
														{t('calendarEvent.edit.locationMinChars')}
													</HintText>
												)}
											{isSearching && (
												<SearchingIndicator role="status">
													<Loader2 size={16} className="spin" />
												</SearchingIndicator>
											)}
											{!isSearching &&
												showLocationDropdown &&
												locationResults.length > 0 && (
													<Dropdown>
														{(() => {
															const saved = locationResults.filter(
																(l) => l.source !== 'google'
															);
															const google = locationResults.filter(
																(l) => l.source === 'google'
															);
															return (
																<>
																	{saved.map((loc) => (
																		<DropdownItem
																			key={loc.id}
																			onClick={() =>
																				handleSelectLocation(
																					loc
																				)
																			}
																		>
																			<ItemIcon aria-label="saved">
																				<Bookmark
																					size={14}
																				/>
																			</ItemIcon>
																			<DropdownItemText>
																				<DropdownItemAddress>
																					{loc.address}
																				</DropdownItemAddress>
																				{loc.description &&
																					loc.description !==
																						loc.id && (
																						<DropdownItemDesc>
																							{
																								loc.description
																							}
																						</DropdownItemDesc>
																					)}
																			</DropdownItemText>
																		</DropdownItem>
																	))}
																	{google.map((loc) => (
																		<DropdownItem
																			key={loc.id}
																			onClick={() =>
																				handleSelectLocation(
																					loc
																				)
																			}
																		>
																			<ItemIcon aria-label="google">
																				<MapPin size={14} />
																			</ItemIcon>
																			<DropdownItemText>
																				<DropdownItemAddress>
																					{loc.address}
																				</DropdownItemAddress>
																				{loc.description && (
																					<DropdownItemDesc>
																						{
																							loc.description
																						}
																					</DropdownItemDesc>
																				)}
																			</DropdownItemText>
																		</DropdownItem>
																	))}
																	{google.length > 0 && (
																		<PoweredByGoogle>
																			{t(
																				'calendarEvent.edit.poweredByGoogle'
																			)}
																		</PoweredByGoogle>
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
											placeholder={t(
												'calendarEvent.edit.locationDescriptionPlaceholder'
											)}
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
									style={{
										backgroundColor: `rgb(${activeColor.r}, ${activeColor.g}, ${activeColor.b})`,
									}}
								/>
								<Chevron $open={colorOpen}>
									<ChevronRight size={16} />
								</Chevron>
							</SectionHeader>
							{colorOpen && (
								<SectionBody>
									<SwatchGrid>
										{COLOR_SWATCHES.map((swatch, i) => (
											<Swatch
												key={i}
												style={{
													backgroundColor: `rgb(${swatch.r}, ${swatch.g}, ${swatch.b})`,
												}}
												$selected={i === selectedColor}
												onClick={() => setSelectedColor(i)}
												aria-label={`Color ${i + 1}`}
											/>
										))}
									</SwatchGrid>
								</SectionBody>
							)}
						</Section>
					</Form>
					{isDirty && (
						<SaveFooter>
							<SaveButton onClick={handleSave} disabled={isSaving || !name.trim()}>
								{isSaving ? (
									<Loader2 size={16} className="spin" />
								) : (
									<Save size={16} />
								)}
								{t('calendarEvent.edit.save')}
							</SaveButton>
						</SaveFooter>
					)}
				</>
			)}
		</Container>
	);
};

export default EditCalendarEvent;

const Container = styled.div`
	display: flex;
	flex-direction: column;
	height: 100%;
	overflow: hidden;
`;

const LoadingContainer = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 0.75rem;
	flex: 1;
`;

const LoadingText = styled.p`
	color: ${({ theme }) => theme.colors.text.secondary};
	font-size: 0.875rem;
`;

const Spinner = styled(Loader2)`
	animation: spin 1s linear infinite;
	color: ${({ theme }) => theme.colors.text.secondary};

	@keyframes spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}
`;

const Header = styled.div`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	margin-bottom: 1.25rem;
	padding: 1rem 1rem 0;
	flex-shrink: 0;
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
	flex: 1;
	overflow-y: auto;
	min-height: 0;
	padding: 0 1rem;
`;

const SaveFooter = styled.div`
	flex-shrink: 0;
	padding: 0.75rem 1rem;
`;

/* ── Collapsible Section ── */

const Section = styled.div`
	border: 1px solid ${({ theme }) => theme.colors.border.default};
	border-radius: ${({ theme }) => theme.borderRadius.medium};
`;

const SectionHeader = styled.button`
	display: flex;
	align-items: center;
	flex-wrap: wrap;
	width: 100%;
	padding: 0.625rem 0.75rem;
	border: none;
	border-radius: inherit;
	background: ${({ theme }) => theme.colors.background.card2};
	color: ${({ theme }) => theme.colors.text.primary};
	cursor: pointer;
	font-size: ${({ theme }) => theme.typography.fontSize.sm};
	font-weight: 600;
	gap: 0.25rem 0.5rem;
	text-align: left;

	&:hover {
		background: ${({ theme }) => theme.colors.background.card};
	}
`;

const SectionTitle = styled.span`
	flex: 1;
`;

const PreviewText = styled.span`
	flex-basis: 100%;
	font-weight: 400;
	font-size: ${({ theme }) => theme.typography.fontSize.xs};
	color: ${({ theme }) => theme.colors.text.muted};
	text-transform: capitalize;
	line-height: 1.4;
`;

const Chevron = styled.span<{ $open: boolean }>`
	display: flex;
	align-items: center;
	flex-shrink: 0;
	color: ${({ theme }) => theme.colors.text.muted};
	transition: transform 0.2s ease;
	${({ $open }) =>
		$open &&
		css`
			transform: rotate(90deg);
		`}
`;

const SectionBody = styled.div`
	display: flex;
	flex-direction: column;
	gap: 0.75rem;
	padding: 0.75rem;
	border-top: 1px solid ${({ theme }) => theme.colors.border.default};
`;

const DateTimeRow = styled.div`
	display: flex;
	gap: 0.5rem;
	align-items: center;

	> select {
		height: 36px;
		padding-top: 0;
		padding-bottom: 0;
	}
`;

const DurationRow = styled.div`
	display: flex;
	gap: 0.75rem;
`;

const DurationField = styled.div`
	display: flex;
	align-items: center;
	gap: 0.375rem;
	flex: 1;
`;

const DurationUnit = styled.span`
	font-size: ${({ theme }) => theme.typography.fontSize.sm};
	color: ${({ theme }) => theme.colors.text.muted};
	flex-shrink: 0;
`;

const DatePickerWrapper = styled.div`
	position: relative;
	flex: 1;
	min-width: 0;
`;

const DateTrigger = styled.button`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	width: 100%;
	height: 36px;
	padding: 0 0.75rem;
	border: 1px solid ${({ theme }) => theme.colors.input.border};
	border-radius: ${({ theme }) => theme.borderRadius.medium};
	background-color: ${({ theme }) => theme.colors.input.bg};
	color: ${({ theme }) => theme.colors.input.text};
	font-size: ${({ theme }) => theme.typography.fontSize.sm};
	cursor: pointer;
	transition: border-color 0.15s ease;
	text-align: left;

	&:hover {
		border-color: ${({ theme }) => theme.colors.input.borderHover};
	}

	&:focus {
		border-color: ${({ theme }) => theme.colors.input.focusRing};
		outline: none;
	}

	svg {
		flex-shrink: 0;
		color: ${({ theme }) => theme.colors.text.muted};
	}
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
	accent-color: ${({ theme }) => theme.colors.brand[500]};
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

	&::-webkit-calendar-picker-indicator {
		filter: ${({ theme }) =>
			theme.colors.text.primary === theme.colors.white ? 'invert(1)' : 'none'};
		cursor: pointer;
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
	accent-color: ${({ theme }) => theme.colors.brand[500]};
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
	border: 1px solid
		${({ $selected, theme }) =>
			$selected ? theme.colors.brand[500] : theme.colors.border.default};
	background: ${({ $selected, theme }) => ($selected ? theme.colors.brand[500] : 'transparent')};
	color: ${({ $selected, theme }) => ($selected ? '#fff' : theme.colors.text.primary)};
	font-size: ${({ theme }) => theme.typography.fontSize.xs};
	cursor: pointer;
	transition: all 0.15s ease;
`;

/* ── Location Autocomplete ── */

const InputWithClear = styled.div`
	position: relative;
	display: flex;
	align-items: center;
`;

const ClearButton = styled.button`
	position: absolute;
	right: 6px;
	display: flex;
	align-items: center;
	justify-content: center;
	width: 20px;
	height: 20px;
	border: none;
	border-radius: 50%;
	background: ${({ theme }) => theme.colors.background.card2};
	color: ${({ theme }) => theme.colors.text.muted};
	cursor: pointer;
	padding: 0;

	&:hover {
		color: ${({ theme }) => theme.colors.text.primary};
		background: ${({ theme }) => theme.colors.border.default};
	}
`;

const AutocompleteWrapper = styled.div``;

const HintText = styled.p`
	margin: 0.25rem 0 0;
	font-size: ${({ theme }) => theme.typography.fontSize.xs};
	color: ${({ theme }) => theme.colors.text.muted};
`;

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
	gap: 0.625rem;
	justify-items: center;
`;

const Swatch = styled.button<{ $selected: boolean }>`
	width: 28px;
	height: 28px;
	border-radius: 50%;
	border: 2px solid
		${({ $selected, theme }) => ($selected ? theme.colors.text.primary : 'transparent')};
	box-shadow: ${({ $selected }) =>
		$selected ? '0 0 0 2px rgba(255,255,255,0.15)' : 'inset 0 1px 2px rgba(0,0,0,0.2)'};
	cursor: pointer;
	transition:
		transform 0.15s ease,
		border-color 0.15s ease,
		box-shadow 0.15s ease;
	outline: none;

	&:hover {
		transform: scale(1.15);
		box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.1);
	}
`;

/* ── Save ── */

const SaveButton = styled.button`
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 0.5rem;
	width: 100%;
	height: 40px;
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

const VerifiedBadge = styled.span`
	display: inline-flex;
	align-items: center;
	gap: 0.25rem;
	font-size: ${({ theme }) => theme.typography.fontSize.xs};
	color: ${({ theme }) => theme.colors.success[600]};
	font-weight: 500;
	margin-top: 0.25rem;
	cursor: default;

	svg {
		flex-shrink: 0;
	}
`;
