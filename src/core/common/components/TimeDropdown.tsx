import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/core/theme/ThemeProvider';
import TimeUtil from '@/core/util/time';

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
		options.push(TimeUtil.minsToMeridian(minutes));
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
	const { t } = useTranslation();
	const timeOptions = React.useMemo(() => generateTimeOptions(interval), [interval]);
	const [isOpen, setIsOpen] = useState(false);
	const triggerRef = useRef<HTMLButtonElement>(null);
	const listRef = useRef<HTMLDivElement>(null);
	const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });

	const localizeTime = (time: string): string => {
		const am = t('settings.sections.tilePreferences.am');
		const pm = t('settings.sections.tilePreferences.pm');
		return time.replace(/\bAM\b/, am).replace(/\bPM\b/, pm);
	};

	const displayValue = value ? localizeTime(value) : placeholder || '';

	const openDropdown = useCallback(() => {
		if (disabled) return;
		const rect = triggerRef.current?.getBoundingClientRect();
		if (rect) {
			setDropdownPos({ top: rect.bottom + 4, left: rect.left });
		}
		setIsOpen(true);
	}, [disabled]);

	// Auto-scroll to selected item when opened
	useEffect(() => {
		if (isOpen && listRef.current && value) {
			const selectedEl = listRef.current.querySelector('[data-selected="true"]');
			if (selectedEl) {
				selectedEl.scrollIntoView({ block: 'center' });
			}
		}
	}, [isOpen, value]);

	// Close on outside click
	useEffect(() => {
		if (!isOpen) return;
		const handleClick = (e: MouseEvent) => {
			if (
				triggerRef.current?.contains(e.target as Node) ||
				listRef.current?.contains(e.target as Node)
			)
				return;
			setIsOpen(false);
		};
		document.addEventListener('mousedown', handleClick);
		return () => document.removeEventListener('mousedown', handleClick);
	}, [isOpen]);

	// Close on Escape
	useEffect(() => {
		if (!isOpen) return;
		const handleKey = (e: KeyboardEvent) => {
			if (e.key === 'Escape') setIsOpen(false);
		};
		document.addEventListener('keydown', handleKey);
		return () => document.removeEventListener('keydown', handleKey);
	}, [isOpen]);

	return (
		<>
			<Trigger
				ref={triggerRef}
				$isDark={isDarkMode}
				onClick={openDropdown}
				disabled={disabled}
				type="button"
			>
				{displayValue}
				<ChevronSvg width="12" height="12" viewBox="0 0 12 12">
					<path fill="currentColor" d="M6 9L1 4h10z" />
				</ChevronSvg>
			</Trigger>
			{isOpen &&
				createPortal(
					<DropdownList
						ref={listRef}
						$isDark={isDarkMode}
						style={{ top: dropdownPos.top, left: dropdownPos.left }}
					>
						{timeOptions.map((time) => (
							<DropdownItem
								key={time}
								$selected={time === value}
								data-selected={time === value}
								onClick={() => {
									onChange(time);
									setIsOpen(false);
								}}
							>
								{localizeTime(time)}
							</DropdownItem>
						))}
					</DropdownList>,
					document.body
				)}
		</>
	);
};

const Trigger = styled.button<{ $isDark: boolean }>`
	width: 100%;
	display: inline-flex;
	align-items: center;
	gap: 6px;
	appearance: none;
	background-color: ${({ theme }) => theme.colors.background.card};
	border: 1px solid ${({ theme }) => theme.colors.border.subtle};
	border-radius: ${({ theme }) => theme.borderRadius.medium};
	color: ${({ theme }) => theme.colors.text.primary};
	padding: 0.75rem 2.5rem 0.75rem 0.75rem;
	font-size: 13px;
	font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
	cursor: pointer;
	position: relative;
	transition: border-color 0.2s ease;
	height: 40px;
	white-space: nowrap;

	&:hover:not(:disabled) {
		border-color: ${({ theme }) => theme.colors.gray[500]};
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
`;

const ChevronSvg = styled.svg`
	position: absolute;
	right: 0.5rem;
	top: 50%;
	transform: translateY(-50%);
	opacity: 0.5;
`;

const DropdownList = styled.div<{ $isDark: boolean }>`
	position: fixed;
	z-index: 10000;
	max-height: 200px;
	overflow-y: auto;
	min-width: 120px;
	background-color: ${({ theme }) => theme.colors.background.card};
	border: 1px solid ${({ theme }) => theme.colors.border.subtle};
	border-radius: ${({ theme }) => theme.borderRadius.medium};
	box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
	padding: 4px 0;

	scrollbar-width: thin;
	scrollbar-color: ${({ theme }) => theme.colors.gray[600]} transparent;
`;

const DropdownItem = styled.div<{ $selected: boolean }>`
	padding: 6px 12px;
	font-size: ${({ theme }) => theme.typography.fontSize.sm};
	font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
	color: ${({ $selected, theme }) =>
		$selected ? theme.colors.brand[400] : theme.colors.text.primary};
	background-color: ${({ $selected, theme }) =>
		$selected ? theme.colors.gray[800] : 'transparent'};
	cursor: pointer;
	transition: background-color 0.15s ease;

	&:hover {
		background-color: ${({ theme }) => theme.colors.gray[700]};
	}
`;

export default TimeDropdown;
