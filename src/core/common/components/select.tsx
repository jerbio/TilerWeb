import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { ChevronDown } from 'lucide-react';
import palette from '@/core/theme/palette';

export type SelectOption<T extends string = string> = {
	value: T;
	label: string;
};

type SelectProps<T extends string = string> = {
	value: T;
	onChange: (value: T) => void;
	options: SelectOption<T>[];
	placeholder?: string;
	disabled?: boolean;
	sized?: 'small' | 'medium' | 'large';
	align?: 'left' | 'right';
	className?: string;
	'aria-label'?: string;
};

function Select<T extends string = string>({
	value,
	onChange,
	options,
	placeholder,
	disabled = false,
	sized = 'medium',
	align = 'left',
	className,
	'aria-label': ariaLabel,
}: SelectProps<T>) {
	const [open, setOpen] = useState(false);
	const containerRef = useRef<HTMLDivElement>(null);

	const selected = options.find((o) => o.value === value);

	useEffect(() => {
		if (!open) return;
		const handleMouseDown = (e: MouseEvent) => {
			if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
				setOpen(false);
			}
		};
		document.addEventListener('mousedown', handleMouseDown);
		return () => document.removeEventListener('mousedown', handleMouseDown);
	}, [open]);

	const handleSelect = (optionValue: T) => {
		onChange(optionValue);
		setOpen(false);
	};

	return (
		<Container ref={containerRef} className={className}>
			<Trigger
				type="button"
				$sized={sized}
				$open={open}
				disabled={disabled}
				aria-haspopup="listbox"
				aria-expanded={open}
				aria-label={ariaLabel}
				onClick={() => !disabled && setOpen((prev) => !prev)}
			>
				<TriggerLabel $hasValue={!!selected}>
					{selected ? selected.label : (placeholder ?? '')}
				</TriggerLabel>
				<ChevronIcon $open={open}>
					<ChevronDown size={14} />
				</ChevronIcon>
			</Trigger>

			{open && (
				<Dropdown role="listbox" $align={align}>
					{options.map((option) => (
						<DropdownItem
							key={option.value}
							role="option"
							aria-selected={option.value === value}
							$active={option.value === value}
							onMouseDown={() => handleSelect(option.value)}
						>
							{option.label}
						</DropdownItem>
					))}
				</Dropdown>
			)}
		</Container>
	);
}

type TriggerProps = {
	$sized: 'small' | 'medium' | 'large';
	$open: boolean;
};

const Container = styled.div`
	position: relative;
	display: inline-flex;
	flex-direction: column;
`;

const Trigger = styled.button<TriggerProps>`
	display: inline-flex;
	align-items: center;
	gap: 0.5rem;
	padding-inline: ${palette.space.small};
	height: ${({ $sized }) =>
		$sized === 'small'
			? palette.buttonHeights.small
			: $sized === 'medium'
				? palette.buttonHeights.medium
				: palette.buttonHeights.large};
	background: ${({ theme }) => theme.colors.tabs.bg};
	border: 1px solid
		${({ theme, $open }) => ($open ? theme.colors.border.strong : theme.colors.tabs.border)};
	border-radius: ${palette.borderRadius.medium};
	color: ${({ theme }) => theme.colors.tabs.text};
	font-size: ${({ $sized }) =>
		$sized === 'small'
			? palette.typography.fontSize.xs
			: $sized === 'medium'
				? palette.typography.fontSize.sm
				: palette.typography.fontSize.base};
	font-weight: ${palette.typography.fontWeight.medium};
	font-family: inherit;
	cursor: pointer;
	white-space: nowrap;
	transition:
		border-color 0.15s ease,
		box-shadow 0.15s ease;

	&:hover:not(:disabled) {
		border-color: ${({ theme }) => theme.colors.border.strong};
	}

	&:focus-visible {
		outline: 2px solid ${({ theme }) => theme.colors.border.strong};
		outline-offset: 2px;
	}

	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
`;

const TriggerLabel = styled.span<{ $hasValue: boolean }>`
	flex: 1;
	text-align: left;
	color: ${({ theme, $hasValue }) =>
		$hasValue ? theme.colors.tabs.textActive : theme.colors.text.muted};
`;

const ChevronIcon = styled.span<{ $open: boolean }>`
	display: inline-flex;
	align-items: center;
	color: ${({ theme }) => theme.colors.text.secondary};
	transform: rotate(${({ $open }) => ($open ? '180deg' : '0deg')});
	transition: transform 0.15s ease;
	flex-shrink: 0;
`;

const Dropdown = styled.div<{ $align: 'left' | 'right' }>`
	position: absolute;
	top: calc(100% + 4px);
	${({ $align }) => ($align === 'right' ? 'right: 0;' : 'left: 0;')}
	min-width: 100%;
	width: max-content;
	z-index: 50;
	background: ${({ theme }) => theme.colors.background.card};
	border: 1px solid ${({ theme }) => theme.colors.border.default};
	border-radius: ${palette.borderRadius.medium};
	box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
	overflow: hidden;
`;

const DropdownItem = styled.div<{ $active: boolean }>`
	padding: 8px ${palette.space.small};
	font-size: ${palette.typography.fontSize.sm};
	font-weight: ${({ $active }) =>
		$active ? palette.typography.fontWeight.semibold : palette.typography.fontWeight.normal};
	color: ${({ theme, $active }) =>
		$active ? theme.colors.tabs.textActive : theme.colors.text.primary};
	background: ${({ theme, $active }) => ($active ? theme.colors.tabs.indicator : 'transparent')};
	cursor: pointer;
	transition: background 0.1s ease;

	&:hover {
		background: ${({ theme }) => theme.colors.background.card2};
	}
`;

export default Select;
