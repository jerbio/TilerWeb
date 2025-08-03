import React from 'react';
import styled from 'styled-components';
import styles from '../../util/styles';

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
	disabled?: boolean;
	variant?: 'default' | 'brand';
	sized?: 'small' | 'medium' | 'large';
	other?: 'textarea'| any;
	height?: number; // Optional height override
	borderGradient?: Array<string>; // Array of colors for border gradient
};

const StyledInputWrapper = styled.div<InputProps>`
	flex: 1;
	display: flex;
	position: relative;
	isolation: isolate;
	padding: 1px;
	height: ${(props) =>
		props.height
			? `${props.height}px`
			: props.sized === 'small'
				? styles.inputHeights.small
				: props.sized === 'medium'
					? styles.inputHeights.medium
					: styles.inputHeights.large};

	${(props) =>
		props.borderGradient &&
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
		props.borderGradient
			? `conic-gradient(from var(--rotation) at 50% 50%, ${props.borderGradient.join(', ')}, ${styles.colors.gray[700]}, ${styles.colors.gray[700]}, ${props.borderGradient[0]})`
			: props.variant === 'brand'
				? styles.colors.brand[400] + '99'
				: styles.colors.gray[800]};
	border-radius: ${styles.borderRadius.little};

	/* Support both input and textarea hover/focus states */
	&:has(input:hover, input:focus, textarea:hover, textarea:focus) {
		background: ${(props) =>
			props.borderGradient
				? `conic-gradient(from var(--rotation) at 50% 50%, ${props.borderGradient.join(', ')}, ${styles.colors.gray[700]}, ${styles.colors.gray[700]}, ${props.borderGradient[0]})`
				: props.variant === 'brand'
					? styles.colors.brand[400] + 'CC'
					: styles.colors.gray[700]};
	}

	&:has(input:focus, textarea:focus) {
		box-shadow: 0 0 0 4px
			${(props) =>
				props.variant === 'brand'
					? styles.colors.brand[400] + '33'
					: styles.colors.gray[900]};
	}

	transition:
		background-color 0.2s ease-in-out,
		box-shadow 0.2s ease-in-out;
`;

const StyledInput = styled.input<InputProps>`
	/* Background color */
	background-color: ${styles.colors.gray[900]};
	border: none;
	outline: none;

	width: 100%;
	border-radius: 5px;
	font-weight: ${styles.typography.fontWeight.normal};
	line-height: 1;
	color: ${styles.colors.white};
	height: 100%;

	padding-inline: calc(
		${(props) => (props.sized === 'small' ? styles.space.small : styles.space.medium)} - 6px
	);
	font-size: ${(props) =>
		props.sized === 'small'
			? styles.typography.fontSize.xs
			: props.sized === 'medium'
				? styles.typography.fontSize.sm
				: styles.typography.fontSize.base};

	&::placeholder {
		color: ${styles.colors.gray[500]};
	}
`;

const StyledTextarea = styled.textarea<InputProps>`
	/* Background color */
	background-color: ${styles.colors.gray[900]};
	border: none;
	outline: none;
	resize: none; /* Prevent manual resizing */

	width: 100%;
	border-radius: 5px;
	font-weight: ${styles.typography.fontWeight.normal};
	line-height: 1.5;
	color: ${styles.colors.white};
	height: 100%;
	
	/* Fix vertical alignment for the textarea */
	padding: 0;
	padding-top: ${(props) => 
		props.sized === 'small' 
			? `calc(${styles.inputHeights.small} / 2 - 0.75rem)` 
			: props.sized === 'medium' 
				? `calc(${styles.inputHeights.medium} / 2 - 0.875rem)` 
				: `calc(${styles.inputHeights.large} / 2 - 1rem)`
	};
	padding-inline: calc(
		${(props) => (props.sized === 'small' ? styles.space.small : styles.space.medium)} - 6px
	);
	font-size: ${(props) =>
		props.sized === 'small'
			? styles.typography.fontSize.xs
			: props.sized === 'medium'
				? styles.typography.fontSize.sm
				: styles.typography.fontSize.base};

	&::placeholder {
		color: ${styles.colors.gray[500]};
		/* Improve placeholder vertical alignment */
		position: relative;
		top: 0;
		line-height: inherit;
		padding: 0;
	}
`;

const Input: React.FC<InputProps> = ({
	disabled = false,
	variant = 'default',
	sized = 'medium',
	borderGradient,
	...props
}) => {
	if (props.other === 'textarea') {
		return (
			<StyledInputWrapper
				{...props}
				disabled={disabled}
				variant={variant}
				sized={sized}
				borderGradient={borderGradient}
			>
				<StyledTextarea
					{...props}
					disabled={disabled}
					variant={variant}
					sized={sized}
					borderGradient={borderGradient}
				/>
			</StyledInputWrapper>
		);
	}
	
	return (
		<StyledInputWrapper
			{...props}
			disabled={disabled}
			variant={variant}
			sized={sized}
			borderGradient={borderGradient}
		>
			<StyledInput
				{...props}
				disabled={disabled}
				variant={variant}
				sized={sized}
				borderGradient={borderGradient}
			/>
		</StyledInputWrapper>
	);
};

export default Input;