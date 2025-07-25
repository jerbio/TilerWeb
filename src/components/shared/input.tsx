import React from 'react';
import styled from 'styled-components';
import styles from '../../util/styles';

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
	disabled?: boolean;
	variant?: 'default' | 'brand';
	sized?: 'small' | 'medium' | 'large';
	height?: number; // Optional height override
	borderGradient?: Array<string>; // Array of colors for border gradient
	as?: string; // Optional 'as' property to support textarea
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

	&:has(input:hover, input:focus) {
		background: ${(props) =>
			props.borderGradient
				? `conic-gradient(from var(--rotation) at 50% 50%, ${props.borderGradient.join(', ')}, ${styles.colors.gray[700]}, ${styles.colors.gray[700]}, ${props.borderGradient[0]})`
				: props.variant === 'brand'
					? styles.colors.brand[400] + 'CC'
					: styles.colors.gray[700]};
	}

	&:has(input:focus) {
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

	width: 100%;
	border-radius: 5px;
	font-weight: ${styles.typography.fontWeight.normal};
	line-height: 1;
	color: ${styles.colors.white};
	resize: none; /* Prevent manual resizing */
	height: auto;
	min-height: ${(props) => (props.height ? `${props.height}px` : '48px')};
	max-height: 150px; /* Optional: Limit the maximum height */
	padding-inline: calc(
		${(props) => (props.sized === 'small' ? styles.space.small : styles.space.medium)} - 6px
	);
	font-size: ${(props) =>
		props.sized === 'small'
			? styles.typography.fontSize.xs
			: props.sized === 'medium'
				? styles.typography.fontSize.sm
				: styles.typography.fontSize.base};
	overflow-y: auto;

	&::placeholder {
		color: ${styles.colors.gray[500]};
	}

	transition:
		background-color 0.2s ease-in-out,
		box-shadow 0.2s ease-in-out;

	&:focus {
		box-shadow: 0 0 0 4px
			${(props) =>
				props.variant === 'brand'
					? styles.colors.brand[400] + '33'
					: styles.colors.gray[900]};
	}
`;

const GradientBorderWrapper = styled.div<{ borderGradient?: string[] }>`
	position: relative;
	display: block;
	border-radius: ${styles.borderRadius.medium};
	padding: 2px;
	background: ${({ borderGradient }) =>
		borderGradient && borderGradient.length >= 2
			? `linear-gradient(135deg, ${borderGradient.join(', ')})`
			: styles.colors.gray[600]};
`;

const InnerWrapper = styled.div`
	background-color: ${styles.colors.gray[900]};
	border-radius: ${styles.borderRadius.medium};
	padding: 0;
`;

const Input: React.FC<InputProps> = ({
	disabled = false,
	variant = 'default',
	sized = 'medium',
	height,
	borderGradient,
	...props
}) => {
	const isTextarea = props.as === 'textarea';

	return (
		<StyledInputWrapper
			{...props}
			disabled={disabled}
			variant={variant}
			sized={sized}
			height={height}
			borderGradient={borderGradient}
		>
			{isTextarea ? (
				<GradientBorderWrapper borderGradient={borderGradient}>
					<InnerWrapper>
						<StyledTextarea
							{...props}
							disabled={disabled}
							variant={variant}
							sized={sized}
							height={height}
						/>
					</InnerWrapper>
				</GradientBorderWrapper>
			) : (
				<StyledInput
					{...props}
					disabled={disabled}
					variant={variant}
					sized={sized}
					borderGradient={borderGradient}
				/>
			)}
		</StyledInputWrapper>
	);
};

export default Input;
