import React from 'react';
import styled from 'styled-components';
import styles from '../../util/styles';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
	children: React.ReactNode;
	onClick?: () => void;
	disabled?: boolean;
	variant?: 'primary' | 'secondary' | 'brand' | string;
	size?: 'small' | 'medium' | 'large';
  height?: number; // Optional height prop for custom button height
	bordergradient?: Array<string>; // Array of colors for border gradient
};

const StyledButton = styled.button<ButtonProps>`
	/* Background color */
	position: relative;
	isolation: isolate;

	&::before {
		content: '';
		position: absolute;
		inset: 1px;
		background: ${(props) =>
			props.variant === 'primary'
				? styles.colors.black
				: props.variant === 'secondary'
					? styles.colors.white
					: props.variant === 'brand'
						? styles.colors.brand[500]
						: props.variant};
		border-radius: ${(props) =>
			props.size === 'small'
				? styles.borderRadius.little
				: styles.borderRadius.medium};
		z-index: -1;
	}

	${(props) =>
		props.bordergradient &&
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

	/* Border color and gradient */
	background: ${(props) =>
		props.bordergradient
			? `conic-gradient(from var(--rotation) at 50% 50%, ${props.bordergradient.join(', ')}, ${styles.colors.gray[700]}, ${styles.colors.gray[700]}, ${props.bordergradient[0]})`
			: props.variant === 'primary'
				? styles.colors.gray[700]
				: 'transparent'};

	color: ${(props) =>
		props.variant === 'primary'
			? styles.colors.white
			: props.variant === 'secondary'
				? styles.colors.black
				: props.variant === 'brand'
					? styles.colors.white
					: styles.colors.white};
	border-radius: ${styles.borderRadius.little};
	font-weight: ${styles.typography.fontWeight.normal};
	line-height: 1;
	display: inline-flex;
	align-items: center;
	gap: 1ch;
	height: ${(props) =>
		props.height ? `${props.height}px` : props.size === 'small'
			? styles.buttonHeights.small
			: props.size === 'medium'
				? styles.buttonHeights.medium
				: styles.buttonHeights.large};
	padding-inline: ${(props) =>
		props.size === 'small' ? styles.space.small : styles.space.medium};
	font-size: ${(props) =>
		props.size === 'small'
			? styles.typography.fontSize.xs
			: props.size === 'medium'
				? styles.typography.fontSize.sm
				: styles.typography.fontSize.base};
	&:hover {
		&::before {
			background-color: ${(props) =>
				props.variant === 'primary'
					? styles.colors.gray[900]
					: props.variant === 'secondary'
						? styles.colors.gray[200]
						: props.variant === 'brand'
							? styles.colors.brand[600]
							: props.variant + '80'};
		}
		${(props) =>
			props.bordergradient &&
			`animation: rotate 3s linear infinite paused;`}
	}
	&:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}
`;

const Button: React.FC<ButtonProps> = ({
	children,
	onClick,
	disabled = false,
	variant = 'primary',
	size = 'medium',
	bordergradient: bordergradient,
	...props
}) => {
	return (
		<StyledButton
			{...props}
			onClick={onClick}
			disabled={disabled}
			variant={variant}
			size={size}
			bordergradient={bordergradient}
		>
			{children}
		</StyledButton>
	);
};

export default Button;

