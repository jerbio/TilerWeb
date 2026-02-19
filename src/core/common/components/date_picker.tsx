import React from 'react';
import ReactDatePicker from 'react-datepicker';
import styled from 'styled-components';
import 'react-datepicker/dist/react-datepicker.css';

type CustomDatePickerProps = {
  label?: string;
  value: string; // YYYY-MM-DD format
  ghostInput?: boolean;
  onChange: (date: string) => void;
  placeholder?: string;
};

const DatePicker: React.FC<CustomDatePickerProps> = ({
  label,
  value,
  onChange,
  placeholder,
  ghostInput,
}) => {
  const handleChange = (date: Date | Date[] | null): void => {
    if (date && !Array.isArray(date)) {
      // Use UTC methods to avoid timezone offset issues
      const year = date.getUTCFullYear();
      const month = String(date.getUTCMonth() + 1).padStart(2, '0');
      const day = String(date.getUTCDate()).padStart(2, '0');
      onChange(`${year}-${month}-${day}`);
    } else {
      onChange('');
    }
  };

  // Parse YYYY-MM-DD as UTC to avoid timezone shifts
  const selectedDate = value
    ? new Date(
      Date.UTC(
        parseInt(value.split('-')[0]),
        parseInt(value.split('-')[1]) - 1,
        parseInt(value.split('-')[2])
      )
    )
    : null;

  return (
    <Container>
      {label && <Label>{label}</Label>}
      <DatePickerWrapper $ghostInput={ghostInput}>
        <ReactDatePicker
          selected={selectedDate}
          onChange={handleChange}
          dateFormat="MM/dd/yyyy"
          placeholderText={placeholder}
          showPopperArrow={false}
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

const DatePickerWrapper = styled.div<{ $ghostInput?: boolean }>`
	/* Style the input inside the date picker */
	.react-datepicker-wrapper {
		width: 100%;
	}

	.react-datepicker__input-container input {
		/* Match Input component styling */
		opacity: 0;
		background-color: ${(props) => props.theme.colors.gray[900]};
		border: 1px solid ${(props) => props.theme.colors.gray[800]};
		border-radius: ${(props) => props.theme.borderRadius.little};
		color: ${(props) => props.theme.colors.white};
		font-size: ${(props) => props.theme.typography.fontSize.sm};
		font-weight: ${(props) => props.theme.typography.fontWeight.normal};
		padding: 0 ${(props) => props.theme.space.medium};
		height: ${(props) => props.theme.inputHeights.medium};
		width: 100%;
		cursor: pointer;
		transition: border-color 0.2s ease-in-out;

		&::placeholder {
			color: ${(props) => props.theme.colors.gray[500]};
		}

		&:hover {
			border-color: ${(props) => props.theme.colors.gray[700]};
		}

		&:focus {
			outline: none;
			border-color: ${(props) => props.theme.colors.brand[500]};
			box-shadow: 0 0 0 4px ${(props) => props.theme.colors.brand[400]}33;
		}
	}

	/* Dark theme for calendar dropdown */
	.react-datepicker-popper {
		z-index: 9999;
	}

	.react-datepicker {
		background-color: ${(props) => props.theme.colors.gray[900]};
		border: 1px solid ${(props) => props.theme.colors.gray[700]};
		border-radius: ${(props) => props.theme.borderRadius.medium};
		font-family: ${(props) => props.theme.typography.fontFamily.inter};
		box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
	}

	.react-datepicker__header {
		background-color: ${(props) => props.theme.colors.gray[800]};
		border-bottom: 1px solid ${(props) => props.theme.colors.gray[700]};
		border-radius: ${(props) => props.theme.borderRadius.medium}
			${(props) => props.theme.borderRadius.medium} 0 0;
		padding-top: 12px;
	}

	.react-datepicker__current-month {
		color: ${(props) => props.theme.colors.white};
		font-weight: ${(props) => props.theme.typography.fontWeight.semibold};
		font-size: ${(props) => props.theme.typography.fontSize.sm};
		margin-bottom: 8px;
	}

	.react-datepicker__day-name {
		color: ${(props) => props.theme.colors.gray[500]};
		font-size: ${(props) => props.theme.typography.fontSize.xs};
		font-weight: ${(props) => props.theme.typography.fontWeight.medium};
	}

	.react-datepicker__day {
		color: ${(props) => props.theme.colors.white};
		border-radius: ${(props) => props.theme.borderRadius.small};
		transition: all 0.2s ease;

		&:hover {
			background-color: ${(props) => props.theme.colors.gray[700]};
		}
	}

	.react-datepicker__day--selected {
		background-color: ${(props) => props.theme.colors.brand[500]};
		color: ${(props) => props.theme.colors.white};
		font-weight: ${(props) => props.theme.typography.fontWeight.semibold};

		&:hover {
			background-color: ${(props) => props.theme.colors.brand[600]};
		}
	}

	.react-datepicker__day--keyboard-selected {
		background-color: ${(props) => props.theme.colors.gray[700]};
		color: ${(props) => props.theme.colors.white};
	}

	.react-datepicker__day--today {
		font-weight: ${(props) => props.theme.typography.fontWeight.semibold};
		color: ${(props) => props.theme.colors.brand[400]};
	}

	.react-datepicker__day--disabled {
		color: ${(props) => props.theme.colors.gray[600]};
		cursor: not-allowed;

		&:hover {
			background-color: transparent;
		}
	}

	.react-datepicker__day--outside-month {
		color: ${(props) => props.theme.colors.gray[600]};
	}

	.react-datepicker__navigation {
		top: 12px;
	}

	.react-datepicker__navigation-icon::before {
		border-color: ${(props) => props.theme.colors.gray[400]};
	}

	.react-datepicker__navigation:hover .react-datepicker__navigation-icon::before {
		border-color: ${(props) => props.theme.colors.white};
	}
`;

export default DatePicker;
