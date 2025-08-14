import React from 'react';
import styled from 'styled-components';
import pallette from '@/core/theme/pallete';

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
	disabled?: boolean;
	variant?: 'default' | 'brand';
	sized?: 'small' | 'medium' | 'large';
	height?: number; // Optional height override
	bordergradient?: Array<string>; // Array of colors for border gradient
};

type StyledInputProps = {
	$disabled: InputProps['disabled'];
	$variant: InputProps['variant'];
	$sized: InputProps['sized'];
	$height: InputProps['height'];
	$bordergradient: InputProps['bordergradient'];
};

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
				? pallette.inputHeights.small
				: props.$sized === 'medium'
					? pallette.inputHeights.medium
					: pallette.inputHeights.large};

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
			? `conic-gradient(from var(--rotation) at 50% 50%, ${props.$bordergradient.join(', ')}, ${pallette.colors.gray[700]}, ${pallette.colors.gray[700]}, ${props.$bordergradient[0]})`
			: props.$variant === 'brand'
				? pallette.colors.brand[400] + '99'
				: pallette.colors.gray[800]};
	border-radius: ${pallette.borderRadius.little};

	&:has(input:hover, input:focus) {
		background: ${(props) =>
			props.$bordergradient
				? `conic-gradient(from var(--rotation) at 50% 50%, ${props.$bordergradient.join(', ')}, ${pallette.colors.gray[700]}, ${pallette.colors.gray[700]}, ${props.$bordergradient[0]})`
				: props.$variant === 'brand'
					? pallette.colors.brand[400] + 'CC'
					: pallette.colors.gray[700]};
	}

	&:has(input:focus) {
		box-shadow: 0 0 0 4px
			${(props) =>
				props.$variant === 'brand'
					? pallette.colors.brand[400] + '33'
					: pallette.colors.gray[900]};
	}

	transition:
		background-color 0.2s ease-in-out,
		box-shadow 0.2s ease-in-out;
`;

const StyledInput = styled.input<StyledInputProps>`
	/* Background color */
	background-color: ${pallette.colors.gray[900]};
	border: none;
	outline: none;

	width: 100%;
	border-radius: 5px;
	font-weight: ${pallette.typography.fontWeight.normal};
	line-height: 1;
	color: ${pallette.colors.white};
	height: 100%;

	padding-inline: calc(
		${(props) => (props.$sized === 'small' ? pallette.space.small : pallette.space.medium)} - 6px
	);
	font-size: ${(props) =>
		props.$sized === 'small'
			? pallette.typography.fontSize.xs
			: props.$sized === 'medium'
				? pallette.typography.fontSize.sm
				: pallette.typography.fontSize.base};

	&::placeholder {
		color: ${pallette.colors.gray[500]};
	}
`;

const Input: React.FC<InputProps> = ({
	disabled = false,
	variant = 'default',
	sized = 'medium',
	height,
	bordergradient,
	...props
}) => {
	const styledProps = {
		$disabled: disabled,
		$variant: variant,
		$sized: sized,
		$height: height,
		$bordergradient: bordergradient,
	};
	return (
		<StyledInputWrapper {...styledProps}>
			<StyledInput disabled={disabled} {...styledProps} {...props} />
		</StyledInputWrapper>
	);
};

export default Input;
