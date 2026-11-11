import React, { useId, useLayoutEffect, useRef, useState } from 'react';
import ReactDatePicker from 'react-datepicker';
import styled, { createGlobalStyle } from 'styled-components';
import 'react-datepicker/dist/react-datepicker.css';
import { useTranslation } from 'react-i18next';
import { de, el, enGB, enUS, es, fr, hi, it, ja, ko, pl, ru, zhCN } from 'date-fns/locale';

const calendarLocales = { de, el, en: enUS, es, fr, hi, it, ja, ko, pl, ru, zh: zhCN };

function LocalizedCalendarContainer({
	className,
	children,
}: {
	className?: string;
	children?: React.ReactNode;
}) {
	const { t } = useTranslation();
	return (
		<LocalizedCalendar
			className={className}
			role="dialog"
			aria-modal="true"
			aria-label={t('datePicker.calendar', 'Choose date')}
		>
			{children}
		</LocalizedCalendar>
	);
}

type CustomDatePickerProps = {
	label?: string;
	value: string; // YYYY-MM-DD format
	ghostInput?: boolean;
	onChange: (date: string) => void;
	placeholder?: string;
	minDate?: string; // YYYY-MM-DD format, disables selection before this date
	maxDate?: string; // YYYY-MM-DD format, disables selection after this date
	portalId?: string;
	disabled?: boolean;
};

const DatePicker: React.FC<CustomDatePickerProps> = ({
	label,
	value,
	onChange,
	placeholder,
	ghostInput = false,
	minDate,
	maxDate,
	portalId,
	disabled = false,
}) => {
	const { t, i18n } = useTranslation();
	const language = i18n?.language ?? 'en';
	const calendarLocale =
		language.toLowerCase() === 'en-gb'
			? enGB
			: (calendarLocales[language.split('-')[0] as keyof typeof calendarLocales] ?? enUS);
	const dateFormat = new Intl.DateTimeFormat(language, {
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
	})
		.formatToParts(new Date(2026, 10, 17))
		.map((part) => {
			if (part.type === 'year') return 'yyyy';
			if (part.type === 'month') return 'MM';
			if (part.type === 'day') return 'dd';
			return `'${part.value.replace(/'/g, "''")}'`;
		})
		.join('');
	const [announcement, setAnnouncement] = useState<{
		kind: 'selected' | 'month';
		date: Date;
	} | null>(null);
	const inputId = useId();
	const container = useRef<HTMLDivElement>(null);
	const [dialogPortalId, setDialogPortalId] = useState<string>();
	useLayoutEffect(() => {
		const dialog = container.current?.closest('dialog');
		if (!dialog) return;
		// Keep the calendar in the native dialog's top layer, outside its scrolling body.
		const host = document.createElement('div');
		host.id = `${inputId}-calendar`;
		host.setAttribute('data-tiler-datepicker-portal', '');
		dialog.appendChild(host);
		setDialogPortalId(host.id);
		return () => host.remove();
	}, [inputId]);
	const effectivePortalId = dialogPortalId ?? portalId;
	const handleChange = (date: Date | Date[] | null): void => {
		if (date && !Array.isArray(date)) {
			setAnnouncement({ kind: 'selected', date });
			// Use local methods for consistency with display
			const year = date.getFullYear();
			const month = String(date.getMonth() + 1).padStart(2, '0');
			const day = String(date.getDate()).padStart(2, '0');
			onChange(`${year}-${month}-${day}`);
		} else {
			setAnnouncement(null);
			onChange('');
		}
	};

	// Parse YYYY-MM-DD as local date
	const selectedDate = value
		? new Date(
				parseInt(value.split('-')[0]),
				parseInt(value.split('-')[1]) - 1,
				parseInt(value.split('-')[2])
			)
		: null;

	// Parse minDate if provided
	const minDateObj = minDate
		? new Date(
				parseInt(minDate.split('-')[0]),
				parseInt(minDate.split('-')[1]) - 1,
				parseInt(minDate.split('-')[2])
			)
		: undefined;

	// Parse maxDate if provided
	const maxDateObj = maxDate
		? new Date(
				parseInt(maxDate.split('-')[0]),
				parseInt(maxDate.split('-')[1]) - 1,
				parseInt(maxDate.split('-')[2])
			)
		: undefined;

	return (
		<Container ref={container}>
			{label && <Label htmlFor={inputId}>{label}</Label>}
			{effectivePortalId && <DatePickerPortalStyles />}
			<DatePickerWrapper $ghostInput={ghostInput}>
				<ReactDatePicker
					id={inputId}
					disabled={disabled}
					selected={selectedDate}
					onChange={handleChange}
					dateFormat={dateFormat}
					locale={calendarLocale}
					calendarClassName="tiler-localized-datepicker"
					calendarContainer={LocalizedCalendarContainer}
					previousMonthAriaLabel={t('datePicker.previousMonth', 'Previous month')}
					previousMonthButtonLabel={t('datePicker.previousMonth', 'Previous month')}
					nextMonthAriaLabel={t('datePicker.nextMonth', 'Next month')}
					nextMonthButtonLabel={t('datePicker.nextMonth', 'Next month')}
					monthAriaLabelPrefix={t('datePicker.month', 'Month')}
					chooseDayAriaLabelPrefix={t('datePicker.chooseDay', 'Choose')}
					disabledDayAriaLabelPrefix={t('datePicker.unavailableDay', 'Unavailable')}
					renderDayContents={(day) => new Intl.NumberFormat(language).format(day)}
					onMonthChange={(month) => setAnnouncement({ kind: 'month', date: month })}
					placeholderText={placeholder}
					showPopperArrow={false}
					minDate={minDateObj}
					maxDate={maxDateObj}
					portalId={effectivePortalId}
				/>
			</DatePickerWrapper>
			<Announcement role="status" aria-live="polite">
				{announcement &&
					(announcement.kind === 'selected'
						? t('datePicker.selectedDate', 'Selected date: {{date}}', {
								date: new Intl.DateTimeFormat(language, {
									dateStyle: 'full',
								}).format(announcement.date),
							})
						: new Intl.DateTimeFormat(language, {
								month: 'long',
								year: 'numeric',
							}).format(announcement.date))}
			</Announcement>
		</Container>
	);
};

const Container = styled.div`
	display: flex;
	flex-direction: column;
	.react-datepicker__aria-live {
		display: none;
	}
`;

// The library's live messages are English-only. Replace them with the localized
// status above, including calendars rendered into a dialog's portal.
const LocalizedCalendar = styled.div`
	.react-datepicker__aria-live {
		display: none;
	}
`;
const Announcement = styled.span`
	position: absolute;
	width: 1px;
	height: 1px;
	overflow: hidden;
	clip-path: inset(50%);
	white-space: nowrap;
`;

const Label = styled.label`
	display: block;
	margin-bottom: 6px;
	font-size: ${(props) => props.theme.typography.fontSize.xs};
	font-weight: ${(props) => props.theme.typography.fontWeight.medium};
	color: ${(props) => props.theme.colors.gray[400]};
`;

const DatePickerWrapper = styled.div<{ $ghostInput: boolean }>`
	/* Style the input inside the date picker */
	.react-datepicker-wrapper {
		width: 100%;
	}

	.react-datepicker__input-container input {
		background-color: ${(props) => props.theme.colors.input.bg};
		border: 1px solid ${(props) => props.theme.colors.input.border};
		border-radius: ${(props) => props.theme.borderRadius.little};
		color: ${(props) => props.theme.colors.input.text};
		font-size: ${(props) => props.theme.typography.fontSize.sm};
		font-weight: ${(props) => props.theme.typography.fontWeight.normal};
		padding: 0 ${(props) => props.theme.space.medium};
		height: ${(props) => props.theme.inputHeights.medium};
		width: 100%;
		cursor: pointer;
		transition: border-color 0.2s ease-in-out;

		&::placeholder {
			color: ${(props) => props.theme.colors.input.placeholder};
		}

		&:hover {
			border-color: ${(props) => props.theme.colors.input.borderHover};
		}

		&:focus {
			outline: none;
			border-color: ${(props) => props.theme.colors.brand[500]};
			box-shadow: 0 0 0 4px ${(props) => props.theme.colors.brand[400]}33;
		}

		${(props) =>
			props.$ghostInput &&
			`
			opacity: 0;
			position: relative;
			z-index: 2;
		`}
	}

	.react-datepicker-popper {
		z-index: 9999;
	}

	.react-datepicker {
		background-color: ${(props) => props.theme.colors.datepicker.bg};
		border: 1px solid ${(props) => props.theme.colors.border.default};
		border-radius: ${(props) => props.theme.borderRadius.medium};
		font-family: ${(props) => props.theme.typography.fontFamily.inter};
		box-shadow: 0 10px 40px rgba(0, 0, 0, 0.25);
	}

	.react-datepicker__header {
		background-color: ${(props) => props.theme.colors.datepicker.headerBg};
		border-bottom: 1px solid ${(props) => props.theme.colors.border.strong};
		border-radius: ${(props) => props.theme.borderRadius.medium}
			${(props) => props.theme.borderRadius.medium} 0 0;
		padding-top: 12px;
	}

	.react-datepicker__current-month {
		color: ${(props) => props.theme.colors.datepicker.headerText};
		font-weight: ${(props) => props.theme.typography.fontWeight.semibold};
		font-size: ${(props) => props.theme.typography.fontSize.sm};
		margin-bottom: 8px;
	}

	.react-datepicker__day-name {
		color: ${(props) => props.theme.colors.datepicker.dayText};
		font-size: ${(props) => props.theme.typography.fontSize.xs};
		font-weight: ${(props) => props.theme.typography.fontWeight.medium};
	}

	.react-datepicker__day {
		color: ${(props) => props.theme.colors.datepicker.dateText};
		border-radius: ${(props) => props.theme.borderRadius.small};
		transition: all 0.2s ease;

		&:hover {
			background-color: ${(props) => props.theme.colors.datepicker.dateHoverBg};
			color: ${(props) => props.theme.colors.datepicker.dateHoverText};
		}
	}

	.react-datepicker__day--selected {
		background-color: ${(props) => props.theme.colors.datepicker.dateSelectedBg};
		color: ${(props) => props.theme.colors.datepicker.dateSelectedText} !important;
		font-weight: ${(props) => props.theme.typography.fontWeight.semibold};

		&:hover {
			background-color: ${(props) => props.theme.colors.datepicker.dateSelectedBg};
			color: ${(props) => props.theme.colors.datepicker.dateSelectedText};
		}
	}

	.react-datepicker__day--keyboard-selected {
		background-color: ${(props) => props.theme.colors.datepicker.dateHoverBg};
		color: ${(props) => props.theme.colors.datepicker.dateHoverText};
	}

	.react-datepicker__day--today {
		font-weight: ${(props) => props.theme.typography.fontWeight.semibold};
		color: ${(props) => props.theme.colors.brand[400]};
	}

	.react-datepicker__day--disabled {
		color: ${(props) => props.theme.colors.datepicker.dateDisabledText};
		cursor: not-allowed;

		&:hover {
			background-color: transparent;
		}
	}

	.react-datepicker__day--outside-month {
		color: ${(props) => props.theme.colors.datepicker.dateOutsideMonthText};
	}

	.react-datepicker__navigation {
		top: 12px;
	}

	.react-datepicker__navigation-icon::before {
		border-color: ${(props) => props.theme.colors.datepicker.headerButton};
	}

	.react-datepicker__navigation:hover .react-datepicker__navigation-icon::before {
		border-color: ${(props) => props.theme.colors.datepicker.headerButtonHover};
	}
`;

const DatePickerPortalStyles = createGlobalStyle`
	#datepicker-portal, [data-tiler-datepicker-portal] {
		.react-datepicker-popper {
			z-index: 9999;
		}

		.react-datepicker {
			background-color: ${(props) => props.theme.colors.datepicker.bg};
			border: 1px solid ${(props) => props.theme.colors.border.default};
			border-radius: ${(props) => props.theme.borderRadius.medium};
			font-family: ${(props) => props.theme.typography.fontFamily.inter};
			box-shadow: 0 10px 40px rgba(0, 0, 0, 0.25);
		}

		.react-datepicker__header {
			background-color: ${(props) => props.theme.colors.datepicker.headerBg};
			border-bottom: 1px solid ${(props) => props.theme.colors.border.strong};
			border-radius: ${(props) => props.theme.borderRadius.medium}
				${(props) => props.theme.borderRadius.medium} 0 0;
			padding-top: 12px;
		}

		.react-datepicker__current-month {
			color: ${(props) => props.theme.colors.datepicker.headerText};
			font-weight: ${(props) => props.theme.typography.fontWeight.semibold};
			font-size: ${(props) => props.theme.typography.fontSize.sm};
			margin-bottom: 8px;
		}

		.react-datepicker__day-name {
			color: ${(props) => props.theme.colors.datepicker.dayText};
			font-size: ${(props) => props.theme.typography.fontSize.xs};
			font-weight: ${(props) => props.theme.typography.fontWeight.medium};
		}

		.react-datepicker__day {
			color: ${(props) => props.theme.colors.datepicker.dateText};
			border-radius: ${(props) => props.theme.borderRadius.small};
			transition: all 0.2s ease;

			&:hover {
				background-color: ${(props) => props.theme.colors.datepicker.dateHoverBg};
				color: ${(props) => props.theme.colors.datepicker.dateHoverText};
			}
		}

		.react-datepicker__day--selected {
			background-color: ${(props) => props.theme.colors.datepicker.dateSelectedBg};
			color: ${(props) => props.theme.colors.datepicker.dateSelectedText} !important;
			font-weight: ${(props) => props.theme.typography.fontWeight.semibold};

			&:hover {
				background-color: ${(props) => props.theme.colors.datepicker.dateSelectedBg};
				color: ${(props) => props.theme.colors.datepicker.dateSelectedText};
			}
		}

		.react-datepicker__day--keyboard-selected {
			background-color: ${(props) => props.theme.colors.datepicker.dateHoverBg};
			color: ${(props) => props.theme.colors.datepicker.dateHoverText};
		}

		.react-datepicker__day--today {
			font-weight: ${(props) => props.theme.typography.fontWeight.semibold};
			color: ${(props) => props.theme.colors.brand[400]};
		}

		.react-datepicker__day--disabled {
			color: ${(props) => props.theme.colors.datepicker.dateDisabledText};
			cursor: not-allowed;

			&:hover {
				background-color: transparent;
			}
		}

		.react-datepicker__day--outside-month {
			color: ${(props) => props.theme.colors.datepicker.dateOutsideMonthText};
		}

		.react-datepicker__navigation {
			top: 12px;
		}

		.react-datepicker__navigation-icon::before {
			border-color: ${(props) => props.theme.colors.datepicker.headerButton};
		}

		.react-datepicker__navigation:hover .react-datepicker__navigation-icon::before {
			border-color: ${(props) => props.theme.colors.datepicker.headerButtonHover};
		}
	}
`;

export default DatePicker;
