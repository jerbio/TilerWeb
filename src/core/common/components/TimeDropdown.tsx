import React from 'react';
import styled from 'styled-components';
import { useTheme } from '@/core/theme/ThemeProvider';

interface TimeDropdownProps {
	value: string;
	onChange: (value: string) => void;
	placeholder?: string;
	interval?: 15 | 30 | 60; // minutes between options
	disabled?: boolean;
}

// Generate time options for all hours of the day
const generateTimeOptions = (interval: 15 | 30 | 60 = 30): string[] => {
	const options: string[] = [];
	const minutesInDay = 24 * 60;

	for (let minutes = 0; minutes < minutesInDay; minutes += interval) {
		const hours = Math.floor(minutes / 60);
		const mins = minutes % 60;
		const period = hours >= 12 ? 'PM' : 'AM';
		const displayHour = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
		const displayMinutes = mins.toString().padStart(2, '0');

		if (mins === 0) {
			options.push(`${displayHour}:00 ${period}`);
		} else {
			options.push(`${displayHour}:${displayMinutes} ${period}`);
		}
	}

	return options;
};

const TimeDropdown: React.FC<TimeDropdownProps> = ({
	value,
	onChange,
	placeholder,
	interval = 30,
	disabled = false,
}) => {
	const { isDarkMode } = useTheme();
	const timeOptions = React.useMemo(() => generateTimeOptions(interval), [interval]);

	return (
		<StyledSelect
			$isDark={isDarkMode}
			value={value}
			onChange={(e) => onChange(e.target.value)}
			disabled={disabled}
		>
			{placeholder && <option value="">{placeholder}</option>}
			{timeOptions.map((time) => (
				<option key={time} value={time}>
					{time}
				</option>
			))}
		</StyledSelect>
	);
};

const StyledSelect = styled.select<{ $isDark: boolean }>`
	appearance: none;
	color-scheme: ${({ $isDark }) => ($isDark ? 'dark' : 'light')};
	background-color: ${({ theme }) => theme.colors.background.card};
	border: 1px solid ${({ theme }) => theme.colors.border.subtle};
	border-radius: ${({ theme }) => theme.borderRadius.medium};
	color: ${({ theme }) => theme.colors.text.primary};
	padding: 0.75rem 2.5rem 0.75rem 1rem;
	font-size: ${({ theme }) => theme.typography.fontSize.sm};
	font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
	cursor: pointer;
	background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23A3A3A3' d='M6 9L1 4h10z'/%3E%3C/svg%3E");
	background-repeat: no-repeat;
	background-position: right 0.75rem center;
	transition: border-color 0.2s ease;

	&:hover:not(:disabled) {
		border-color: ${({ theme }) => theme.colors.gray[700]};
	}

	&:focus {
		outline: none;
		border-color: ${({ theme }) => theme.colors.brand[500]};
		box-shadow: 0 0 0 2px ${({ theme }) => theme.colors.brand[500]}33;
	}

	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	option {
		background-color: ${({ theme }) => theme.colors.background.card};
		color: ${({ theme }) => theme.colors.text.primary};
		padding: 0.5rem;
	}
`;

export default TimeDropdown;
