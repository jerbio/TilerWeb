import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dayjs from 'dayjs';
import styled, { css } from 'styled-components';
import { ChevronLeft, ChevronRight } from 'lucide-react';

// ── Locale helpers ────────────────────────────────────────────────────────────

/**
 * Detects the user's locale date format (e.g. "MM/DD/YYYY" or "DD/MM/YYYY")
 * by formatting a known date through Intl.DateTimeFormat and inspecting the
 * component order.  Falls back to MM/DD/YYYY on any error.
 */
function getLocaleDateFormat(): string {
	try {
		const parts = new Intl.DateTimeFormat(undefined, {
			year: 'numeric',
			month: '2-digit',
			day: '2-digit',
		}).formatToParts(new Date(2013, 11, 15)); // Dec 15 2013 — unambiguous
		return parts
			.map((p) => {
				if (p.type === 'month') return 'MM';
				if (p.type === 'day') return 'DD';
				if (p.type === 'year') return 'YYYY';
				if (p.type === 'literal') return p.value;
				return '';
			})
			.join('');
	} catch {
		return 'MM/DD/YYYY';
	}
}

const LOCALE_DATE_FORMAT = getLocaleDateFormat();

/**
 * Parses a user-typed date string without requiring customParseFormat.
 * Accepts ISO-8601 (YYYY-MM-DD) and the locale format detected above.
 */
function parseDateInput(str: string, localeFormat: string): dayjs.Dayjs | null {
	const trimmed = str.trim();
	if (!trimmed) return null;

	// ISO 8601 fast-path
	if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
		const d = dayjs(trimmed);
		return d.isValid() ? d : null;
	}

	// Locale-format path
	const sep = localeFormat.replace(/[MYYD]/g, '').charAt(0) || '/';
	const fParts = localeFormat.split(sep);
	const vParts = trimmed.split(sep);
	if (fParts.length !== 3 || vParts.length !== 3) return null;

	let year: number | null = null,
		month: number | null = null,
		day: number | null = null;

	for (let i = 0; i < fParts.length; i++) {
		const val = parseInt(vParts[i], 10);
		if (isNaN(val)) return null;
		if (fParts[i].includes('Y')) year = val;
		else if (fParts[i].includes('M')) month = val;
		else if (fParts[i].includes('D')) day = val;
	}

	if (year === null || month === null || day === null) return null;
	if (year < 1 || year > 9999) return null;
	if (month < 1 || month > 12) return null;
	if (day < 1 || day > 31) return null;

	const d = dayjs(new Date(year, month - 1, day));
	return d.isValid() && d.date() === day ? d : null;
}

/** First year shown in a 12-year page, centred around the given year. */
const yearPageBase = (year: number) => Math.max(1, year - 5);

type PickerMode = 'calendar' | 'year';

type CalendarDatePickerProps = {
	isOpen: boolean;
	onClose: () => void;
	onDateSelect: (date: dayjs.Dayjs) => void;
	startDay?: dayjs.Dayjs;
	daysInView?: number;
	selectedDate?: dayjs.Dayjs;
};

const CalendarDatePicker = ({
	isOpen,
	onClose,
	onDateSelect,
	startDay,
	daysInView,
	selectedDate,
}: CalendarDatePickerProps) => {
	const [displayMonth, setDisplayMonth] = useState(dayjs().startOf('month'));
	const [pickerMode, setPickerMode] = useState<PickerMode>('calendar');
	const [yearBase, setYearBase] = useState(() => yearPageBase(dayjs().year()));
	const [textInputValue, setTextInputValue] = useState('');

	const containerRef = useRef<HTMLDivElement>(null);
	const onCloseRef = useRef(onClose);
	onCloseRef.current = onClose;

	const localeFormat = useMemo(() => LOCALE_DATE_FORMAT, []);

	// Reset all state when the picker opens
	useEffect(() => {
		if (isOpen) {
			const anchor = selectedDate ?? startDay ?? dayjs();
			setDisplayMonth(anchor.startOf('month'));
			setPickerMode('calendar');
			setYearBase(yearPageBase(anchor.year()));
			setTextInputValue(anchor.format(localeFormat));
		}
	}, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

	// Close on outside click
	useEffect(() => {
		if (!isOpen) return;

		const handleClickOutside = (e: MouseEvent) => {
			if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
				onCloseRef.current();
			}
		};

		// Defer to avoid catching the opening click
		const timer = setTimeout(() => {
			document.addEventListener('mousedown', handleClickOutside);
		}, 0);

		return () => {
			clearTimeout(timer);
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, [isOpen]);

	// Close on Escape
	useEffect(() => {
		if (!isOpen) return;

		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === 'Escape') onCloseRef.current();
		};
		document.addEventListener('keydown', handleKeyDown);
		return () => document.removeEventListener('keydown', handleKeyDown);
	}, [isOpen]);

	const today = dayjs().startOf('day');
	const viewStart = startDay?.startOf('day');
	const viewEnd =
		viewStart && daysInView ? viewStart.add(daysInView - 1, 'day').startOf('day') : undefined;
	const selected = selectedDate?.startOf('day');

	// Nav buttons change meaning in year mode
	const handlePrevNav = useCallback(() => {
		if (pickerMode === 'calendar') setDisplayMonth((m) => m.subtract(1, 'month'));
		else setYearBase((y) => Math.max(1, y - 12));
	}, [pickerMode]);

	const handleNextNav = useCallback(() => {
		if (pickerMode === 'calendar') setDisplayMonth((m) => m.add(1, 'month'));
		else setYearBase((y) => y + 12);
	}, [pickerMode]);

	const handleYearSelect = (year: number) => {
		setDisplayMonth((m) => m.year(year));
		setPickerMode('calendar');
	};

	const handleTextCommit = (val: string) => {
		const parsed = parseDateInput(val, localeFormat);
		if (parsed) {
			setDisplayMonth(parsed.startOf('month'));
			onDateSelect(parsed);
		}
	};

	const handleSelect = useCallback(
		(date: dayjs.Dayjs) => {
			onDateSelect(date);
			onClose();
		},
		[onDateSelect, onClose]
	);

	if (!isOpen) return null;

	// Build the 6×7 grid
	const firstOfMonth = displayMonth.startOf('month');
	const gridStart = firstOfMonth.startOf('week');

	// Build day-of-week header labels from locale
	const weekDayLabels: string[] = [];
	for (let i = 0; i < 7; i++) {
		weekDayLabels.push(gridStart.add(i, 'day').format('dd'));
	}

	const rows: dayjs.Dayjs[][] = [];
	let cursor = gridStart;
	for (let week = 0; week < 6; week++) {
		const row: dayjs.Dayjs[] = [];
		for (let d = 0; d < 7; d++) {
			row.push(cursor);
			cursor = cursor.add(1, 'day');
		}
		rows.push(row);
	}

	const prevLabel = pickerMode === 'calendar' ? 'Previous month' : 'Previous years';
	const nextLabel = pickerMode === 'calendar' ? 'Next month' : 'Next years';

	return (
		<PickerContainer ref={containerRef}>
			{/* Manual date text input */}
			<DateTextInput
				type="text"
				value={textInputValue}
				onChange={(e) => setTextInputValue(e.target.value)}
				onBlur={(e) => handleTextCommit(e.target.value)}
				onKeyDown={(e) => {
					if (e.key === 'Enter') {
						handleTextCommit(e.currentTarget.value);
						e.preventDefault();
					}
				}}
				placeholder={localeFormat}
				aria-label="Type a date"
			/>

			{/* Header */}
			<PickerHeader>
				<NavButton onClick={handlePrevNav} aria-label={prevLabel}>
					<ChevronLeft size={14} />
				</NavButton>

				{pickerMode === 'calendar' ? (
					<HeaderCenter>
						<MonthSpan>{displayMonth.format('MMMM')}</MonthSpan>{' '}
						<YearButton
							onClick={() => {
								setYearBase(yearPageBase(displayMonth.year()));
								setPickerMode('year');
							}}
							aria-label={`${displayMonth.year()}, select year`}
						>
							{displayMonth.year()}
						</YearButton>
					</HeaderCenter>
				) : (
					<MonthLabel>
						{yearBase} – {yearBase + 11}
					</MonthLabel>
				)}

				<NavButton onClick={handleNextNav} aria-label={nextLabel}>
					<ChevronRight size={14} />
				</NavButton>
			</PickerHeader>

			{/* Calendar grid */}
			{pickerMode === 'calendar' && (
				<>
					<DayNamesRow>
						{weekDayLabels.map((label, i) => (
							<DayName key={i}>{label}</DayName>
						))}
					</DayNamesRow>
					<DatesGrid>
						{rows.map((row, rowIdx) => (
							<WeekRow
								key={rowIdx}
								$isViewedWeek={
									!!(viewStart && viewEnd) &&
									row.some(
										(d) =>
											(d.isSame(viewStart, 'day') ||
												d.isAfter(viewStart, 'day')) &&
											(d.isSame(viewEnd, 'day') || d.isBefore(viewEnd, 'day'))
									)
								}
							>
								{row.map((date, colIdx) => {
									const isToday = date.isSame(today, 'day');
									const isOutsideMonth = !date.isSame(displayMonth, 'month');
									const isSelected = !!selected && date.isSame(selected, 'day');
									const isInViewedWeek =
										!!(viewStart && viewEnd) &&
										(date.isSame(viewStart, 'day') ||
											date.isAfter(viewStart, 'day')) &&
										(date.isSame(viewEnd, 'day') ||
											date.isBefore(viewEnd, 'day'));

									return (
										<DateCell
											key={colIdx}
											$isToday={isToday}
											$isOutsideMonth={isOutsideMonth}
											$isInViewedWeek={isInViewedWeek}
											$isSelected={isSelected}
											onClick={() => handleSelect(date)}
										>
											{date.date()}
										</DateCell>
									);
								})}
							</WeekRow>
						))}
					</DatesGrid>
				</>
			)}

			{/* Year grid */}
			{pickerMode === 'year' && (
				<YearGrid>
					{Array.from({ length: 12 }, (_, i) => yearBase + i).map((year) => (
						<YearCell
							key={year}
							$isSelected={year === displayMonth.year()}
							$isCurrent={year === today.year()}
							onClick={() => handleYearSelect(year)}
						>
							{year}
						</YearCell>
					))}
				</YearGrid>
			)}
		</PickerContainer>
	);
};

const PickerContainer = styled.div`
	position: absolute;
	top: 100%;
	left: 0;
	margin-top: 4px;
	z-index: 1100;
	background-color: ${({ theme }) => theme.colors.datepicker.bg};
	border: 1px solid ${({ theme }) => theme.colors.calendar.border};
	border-radius: ${({ theme }) => theme.borderRadius.large};
	box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
	padding: 8px;
	width: 224px;
	user-select: none;
`;

const DateTextInput = styled.input`
	width: 100%;
	height: 28px;
	padding: 0 0.5rem;
	margin-bottom: 6px;
	border: 1px solid ${({ theme }) => theme.colors.input.border};
	border-radius: ${({ theme }) => theme.borderRadius.medium};
	background-color: ${({ theme }) => theme.colors.input.bg};
	color: ${({ theme }) => theme.colors.input.text};
	font-size: 0.6875rem;
	outline: none;
	box-sizing: border-box;

	&::placeholder {
		color: ${({ theme }) => theme.colors.input.placeholder};
		font-style: italic;
	}

	&:focus {
		border-color: ${({ theme }) => theme.colors.input.focusRing};
	}
`;

const PickerHeader = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 2px 0 6px;
	background-color: ${({ theme }) => theme.colors.datepicker.headerBg};
	border-radius: ${({ theme }) => theme.borderRadius.medium};
	padding-inline: 4px;
	margin-bottom: 4px;
`;

const HeaderCenter = styled.span`
	font-size: 0.75rem;
	font-weight: 600;
	color: ${({ theme }) => theme.colors.datepicker.headerText};
`;

const MonthSpan = styled.span``;

const YearButton = styled.button`
	font-size: 0.75rem;
	font-weight: 600;
	color: ${({ theme }) => theme.colors.datepicker.headerText};
	background: transparent;
	border: none;
	cursor: pointer;
	padding: 0 2px;
	border-radius: ${({ theme }) => theme.borderRadius.small};
	text-decoration: underline dotted;
	text-underline-offset: 2px;

	&:hover {
		color: ${({ theme }) => theme.colors.datepicker.headerButtonHover};
		background-color: ${({ theme }) => theme.colors.datepicker.dateHoverBg};
	}
`;

const MonthLabel = styled.span`
	font-size: 0.75rem;
	font-weight: 600;
	color: ${({ theme }) => theme.colors.datepicker.headerText};
	text-transform: capitalize;
`;

const NavButton = styled.button`
	display: flex;
	align-items: center;
	justify-content: center;
	width: 22px;
	height: 22px;
	background: transparent;
	color: ${({ theme }) => theme.colors.datepicker.headerButton};
	border-radius: ${({ theme }) => theme.borderRadius.medium};
	cursor: pointer;
	transition:
		color 0.15s ease,
		background-color 0.15s ease;

	&:hover {
		color: ${({ theme }) => theme.colors.datepicker.headerButtonHover};
		background-color: ${({ theme }) => theme.colors.datepicker.dateHoverBg};
	}
`;

const DayNamesRow = styled.div`
	display: grid;
	grid-template-columns: repeat(7, 1fr);
	margin-bottom: 2px;
`;

const DayName = styled.span`
	text-align: center;
	font-size: 0.625rem;
	font-weight: 600;
	color: ${({ theme }) => theme.colors.datepicker.dayText};
	padding: 2px 0;
	text-transform: uppercase;
`;

const DatesGrid = styled.div`
	display: flex;
	flex-direction: column;
	gap: 1px;
`;

const WeekRow = styled.div<{ $isViewedWeek: boolean }>`
	display: grid;
	grid-template-columns: repeat(7, 1fr);
	border-radius: ${({ theme }) => theme.borderRadius.medium};
	background-color: ${({ $isViewedWeek, theme }) =>
		$isViewedWeek ? theme.colors.datepicker.dateHoverBg : 'transparent'};
`;

const DateCell = styled.button<{
	$isToday: boolean;
	$isOutsideMonth: boolean;
	$isInViewedWeek: boolean;
	$isSelected: boolean;
}>`
	width: 28px;
	height: 28px;
	display: flex;
	align-items: center;
	justify-content: center;
	justify-self: center;
	font-size: 0.6875rem;
	font-weight: 500;
	border-radius: ${({ theme }) => theme.borderRadius.medium};
	cursor: pointer;
	background-color: ${({ $isToday, $isSelected, theme }) =>
		$isToday || $isSelected ? theme.colors.datepicker.dateSelectedBg : 'transparent'};
	color: ${({ $isToday, $isSelected, $isOutsideMonth, theme }) => {
		if ($isToday || $isSelected) return theme.colors.datepicker.dateSelectedText;
		if ($isOutsideMonth) return theme.colors.datepicker.dateOutsideMonthText;
		return theme.colors.datepicker.dateText;
	}};
	transition:
		background-color 0.15s ease,
		color 0.15s ease;

	&:hover {
		background-color: ${({ $isToday, $isSelected, theme }) =>
			$isToday || $isSelected
				? theme.colors.datepicker.dateSelectedBg
				: theme.colors.datepicker.dateHoverBg};
		color: ${({ $isToday, $isSelected, theme }) =>
			$isToday || $isSelected
				? theme.colors.datepicker.dateSelectedText
				: theme.colors.datepicker.dateHoverText};
	}
`;

const YearGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(4, 1fr);
	gap: 4px;
	padding: 4px 0;
`;

const YearCell = styled.button<{ $isSelected: boolean; $isCurrent: boolean }>`
	height: 32px;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 0.75rem;
	font-weight: 500;
	border-radius: ${({ theme }) => theme.borderRadius.medium};
	cursor: pointer;
	background-color: ${({ $isSelected, theme }) =>
		$isSelected ? theme.colors.datepicker.dateSelectedBg : 'transparent'};
	color: ${({ $isSelected, $isCurrent, theme }) => {
		if ($isSelected) return theme.colors.datepicker.dateSelectedText;
		if ($isCurrent) return theme.colors.datepicker.dateSelectedBg;
		return theme.colors.datepicker.dateText;
	}};
	${({ $isCurrent, $isSelected, theme }) =>
		$isCurrent &&
		!$isSelected &&
		css`
			border: 1px solid ${theme.colors.datepicker.dateSelectedBg};
		`}
	transition:
		background-color 0.15s ease,
		color 0.15s ease;

	&:hover {
		background-color: ${({ $isSelected, theme }) =>
			$isSelected
				? theme.colors.datepicker.dateSelectedBg
				: theme.colors.datepicker.dateHoverBg};
	}
`;

export default CalendarDatePicker;
