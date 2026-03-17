import React from 'react';
import ReactDatePicker from 'react-datepicker';
import styled, { createGlobalStyle } from 'styled-components';
import 'react-datepicker/dist/react-datepicker.css';

type CustomDatePickerProps = {
	label?: string;
	value: string; // YYYY-MM-DD format
	onChange: (date: string) => void;
	placeholder?: string;
	ghostInput?: boolean;
	portalId?: string;
};

const DatePicker: React.FC<CustomDatePickerProps> = ({
	label,
	value,
	onChange,
	placeholder,
	ghostInput = false,
	portalId,
}) => {
	const handleChange = (date: Date | Date[] | null): void => {
		if (date && !Array.isArray(date)) {
			// Use local methods for consistency with display
			const year = date.getFullYear();
			const month = String(date.getMonth() + 1).padStart(2, '0');
			const day = String(date.getDate()).padStart(2, '0');
			onChange(`${year}-${month}-${day}`);
		} else {
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

	return (
		<Container>
			{label && <Label>{label}</Label>}
			{portalId && <DatePickerPortalStyles />}
			<DatePickerWrapper $ghostInput={ghostInput}>
				<ReactDatePicker
					selected={selectedDate}
					onChange={handleChange}
					dateFormat="MM/dd/yyyy"
					placeholderText={placeholder}
					showPopperArrow={false}
					portalId={portalId}
				/>
			</DatePickerWrapper>
		</Container>
	);
};

const Container = styled.div`
	display: flex;
	flex-direction: column;
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
	#datepicker-portal {
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
