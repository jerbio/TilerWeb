import React from 'react';
import styled from 'styled-components';
import palette from '@/core/theme/palette';
import { Asterisk } from 'lucide-react';

type InputProps = {
	containerClass?: string;
	containerStyle?: React.CSSProperties;
	label?: React.ReactNode;
	disabled?: boolean;
	variant?: 'default' | 'brand';
	sized?: 'small' | 'medium' | 'large';
	height?: number;
	bordergradient?: Array<string>;
	prepend?: React.ReactNode;
	append?: React.ReactNode;
	searchList?: Array<string>;
	onSearchSelect?: (value: string) => void;
};

type StyledInputProps = {
	$label: InputProps['label'];
	$disabled: InputProps['disabled'];
	$variant: InputProps['variant'];
	$sized: InputProps['sized'];
	$height: InputProps['height'];
	$bordergradient: InputProps['bordergradient'];
	$prepend?: InputProps['prepend'];
	$append?: InputProps['append'];
};

export type BaseInputProps = React.InputHTMLAttributes<HTMLInputElement> & InputProps;
const BaseInput: React.FC<BaseInputProps> = ({
	containerClass,
	containerStyle,
	disabled = false,
	variant = 'default',
	sized = 'medium',
	required,
	height,
	bordergradient,
	label,
	prepend,
	append,
	searchList,
	onSearchSelect,
	...props
}) => {
	const styledProps = {
		$disabled: disabled,
		$variant: variant,
		$sized: sized,
		$height: height,
		$bordergradient: bordergradient,
		$label: label,
		$prepend: prepend,
		$append: append,
	};
	const id = label ? `input-${Math.random().toString(36).substring(2, 9)}` : undefined;
	const listId = searchList ? `${id}-list` : undefined;
	function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
		if (onSearchSelect) {
			if (searchList && searchList.includes(e.target.value)) {
				onSearchSelect(e.target.value);
			}
		}
	}

	const styledInput = (
		<StyledInputWrapper {...styledProps} className={containerClass} style={containerStyle}>
			{prepend && <StyledInputPrepend>{prepend}</StyledInputPrepend>}
			{searchList && (
				<datalist id={listId}>
					{searchList.map((item) => (
						<option value={item} key={item} />
					))}
				</datalist>
			)}
			<StyledInput
				id={id}
				list={listId}
				disabled={disabled}
				onInput={handleInputChange}
				{...styledProps}
				{...props}
			/>
			{append && <StyledInputAppend {...styledProps}>{append}</StyledInputAppend>}
		</StyledInputWrapper>
	);

	return label ? (
		<div style={containerStyle} className={containerClass}>
			<StyledLabel htmlFor={id} {...styledProps}>
				{label}{' '}
				{required && (
					<StyledLabelRequired>
						<Asterisk size={12} />
					</StyledLabelRequired>
				)}
			</StyledLabel>
			{styledInput}
		</div>
	) : (
		styledInput
	);
};

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> &
	Omit<InputProps, 'prepend' | 'searchList'>;
const Textarea: React.FC<TextareaProps> = ({
	disabled = false,
	variant = 'default',
	sized = 'medium',
	height,
	bordergradient,
	label,
	...props
}) => {
	const styledProps = {
		$disabled: disabled,
		$variant: variant,
		$sized: sized,
		$height: height,
		$bordergradient: bordergradient,
		$label: label,
	};
	return (
		<StyledInputWrapper {...styledProps}>
			<StyledTextarea disabled={disabled} {...styledProps} {...props} />
		</StyledInputWrapper>
	);
};

const StyledLabelRequired = styled.span`
	color: ${({ theme }) => theme.colors.error[400]};
`;

const StyledLabel = styled.label<StyledInputProps>`
	display: flex;
	gap: 0.25rem;
	margin-bottom: 6px;
	font-size: ${(props) =>
		props.$sized === 'small'
			? palette.typography.fontSize.xs
			: props.$sized === 'medium'
				? palette.typography.fontSize.xs
				: palette.typography.fontSize.sm};
	font-weight: ${palette.typography.fontWeight.medium};
	color: ${({ theme }) => theme.colors.text.secondary};
`;

const StyledInputPrepend = styled.div`
	position: absolute;
	left: 0;
	height: 100%;
	width: 40px;
	display: flex;
	justify-content: center;
	align-items: center;
	pointer-events: none;
`;

const StyledInputAppend = styled.div<StyledInputProps>`
	position: absolute;
	right: 0;
	height: 100%;
	display: flex;
	justify-content: center;
	align-items: center;
	pointer-events: none;
	padding-right: ${(props) => (props.$sized === 'small' ? '8px' : '12px')};
`;

const StyledInputWrapper = styled.div<StyledInputProps>`
	flex: 1;
	display: flex;
	position: relative;
	isolation: isolate;
	padding: 1px;
	height: ${(props) =>
		props.$height
			? `${props.$height}px`
			: props.$sized === 'small'
				? palette.inputHeights.small
				: props.$sized === 'medium'
					? palette.inputHeights.medium
					: palette.inputHeights.large};

	${(props) =>
		props.$bordergradient &&
		`@property --rotation {
      inherits: false;
      initial-value: 0deg;
      syntax: '<angle>';
    }
    @keyframes rotate {
      100% {
        --rotation: 360deg;
      }
    }
    animation: rotate 3s linear infinite;`}

	background: ${(props) =>
		props.$bordergradient
			? `conic-gradient(from var(--rotation) at 50% 50%, ${props.$bordergradient.join(', ')}, ${props.theme.colors.input.gradientNeutral}, ${props.theme.colors.input.gradientNeutral}, ${props.$bordergradient[0]})`
			: props.$variant === 'brand'
				? palette.colors.brand[400] + '99'
				: props.theme.colors.input.border};
	border-radius: ${palette.borderRadius.little};

	${StyledInputPrepend}, ${StyledInputAppend} {
		color: ${({ theme }) => theme.colors.input.placeholder};
		transition: color 0.2s ease-in-out;
	}

	&:has(input:hover, input:focus) {
		background: ${(props) =>
			props.$bordergradient
				? `conic-gradient(from var(--rotation) at 50% 50%, ${props.$bordergradient.join(', ')}, ${props.theme.colors.input.gradientNeutral}, ${props.theme.colors.input.gradientNeutral}, ${props.$bordergradient[0]})`
				: props.$variant === 'brand'
					? palette.colors.brand[400] + 'CC'
					: props.theme.colors.input.borderHover};
	}

	&:has(input:focus) {
		box-shadow: 0 0 0 4px
			${(props) =>
				props.$variant === 'brand'
					? palette.colors.brand[400] + '33'
					: props.theme.colors.input.focusRing};

		${StyledInputPrepend}, ${StyledInputAppend} {
			color: ${palette.colors.brand[400]};
		}
	}

	transition:
		background-color 0.2s ease-in-out,
		box-shadow 0.2s ease-in-out;
`;

const StyledInput = styled.input<StyledInputProps>`
	/* Background color */
	background-color: ${({ theme }) => theme.colors.input.bg};
	border: none;
	outline: none;

	width: 100%;
	border-radius: 5px;
	font-weight: ${palette.typography.fontWeight.normal};
	line-height: 1;
	color: ${({ theme }) => theme.colors.input.text};
	height: 100%;

	padding-left: calc(
		${(props) => (props.$sized === 'small' ? palette.space.small : palette.space.medium)} -
			6px + ${(props) => (props.$prepend ? '20px' : '0px')}
	);
	padding-right: calc(
		${(props) => (props.$sized === 'small' ? palette.space.small : palette.space.medium)} -
			6px + ${(props) => (props.$append ? '32px' : '0px')}
	);
	font-size: ${(props) =>
		props.$sized === 'small'
			? palette.typography.fontSize.xs
			: props.$sized === 'medium'
				? palette.typography.fontSize.sm
				: palette.typography.fontSize.base};

	&::placeholder {
		color: ${({ theme }) => theme.colors.input.placeholder};
	}

	&:read-only {
		color: ${({ theme }) => theme.colors.input.placeholder};
		cursor: not-allowed;
	}
`;

const StyledTextarea = styled.textarea<StyledInputProps>`
	/* Background color */
	background-color: ${({ theme }) => theme.colors.input.bg};
	border: none;
	outline: none;
	resize: none; /* Prevent manual resizing */

	width: 100%;
	border-radius: 5px;
	font-weight: ${palette.typography.fontWeight.normal};
	line-height: 1.5;
	color: ${({ theme }) => theme.colors.input.text};
	height: 100%;

	/* Fix vertical alignment for the textarea */
	padding: 0;
	padding-top: ${(props) =>
		props.$sized === 'small'
			? `calc(${palette.inputHeights.small} / 2 - 0.75rem)`
			: props.$sized === 'medium'
				? `calc(${palette.inputHeights.medium} / 2 - 0.875rem)`
				: `calc(${palette.inputHeights.large} / 2 - 1rem)`};
	padding-inline: calc(
		${(props) => (props.$sized === 'small' ? palette.space.small : palette.space.medium)} - 6px
	);
	font-size: ${(props) =>
		props.$sized === 'small'
			? palette.typography.fontSize.xs
			: props.$sized === 'medium'
				? palette.typography.fontSize.sm
				: palette.typography.fontSize.base};

	&::placeholder {
		color: ${({ theme }) => theme.colors.input.placeholder};
		/* Improve placeholder vertical alignment */
		position: relative;
		top: 0;
		line-height: inherit;
		padding: 0;
	}
`;

const Input = Object.assign(BaseInput, { Textarea });
export default Input;
