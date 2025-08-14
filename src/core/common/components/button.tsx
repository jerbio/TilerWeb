import React from 'react';
import styled, { css } from 'styled-components';
import palette from '@/core/theme/palette';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'brand' | 'ghost' | string;
  size?: 'small' | 'medium' | 'large';
  height?: number; // Optional height prop for custom button height
  bordergradient?: Array<string>; // Array of colors for border gradient
	dotstatus?: 'parsed' | 'clarification' | 'executed'; //
};

const getDotColor = (status?: string) => {
	if (status === 'parsed') return palette.colors.teal[500]; // yellow
	if (status === 'clarification') return palette.colors.error[500]; // red
	if (status === 'executed') return palette.colors.success[500]; // green
	return 'transparent';
};

const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  disabled = false,
  variant = 'primary',
  size = 'medium',
  bordergradient: bordergradient,
  height,
	dotstatus,
}) => {
  return (
    <StyledButton
      onClick={onClick}
      disabled={disabled}
      $disabled={disabled}
      $variant={variant}
      $size={size}
      $bordergradient={bordergradient}
      $height={height}
			$dotstatus={dotstatus}
    >
      {children}
    </StyledButton>
  );
};

type StyledButtonProps = {
  $bordergradient: ButtonProps['bordergradient'];
  $variant: ButtonProps['variant'];
  $size: ButtonProps['size'];
  $height: ButtonProps['height'];
  $disabled: ButtonProps['disabled'];
	$dotstatus: ButtonProps['dotstatus'];
};

const StyledButton = styled.button<StyledButtonProps>`
	/* Background color */
	position: relative;
	isolation: isolate;

	&::before {
		content: '';
		position: absolute;
		inset: 1px;
		background: ${(props) =>
    props.$variant === 'primary'
      ? palette.colors.black
      : props.$variant === 'secondary'
        ? palette.colors.white
        : props.$variant === 'brand'
          ? palette.colors.brand[500]
          : props.$variant === 'ghost'
            ? 'transparent'
            : props.$variant};
		border-radius: ${(props) =>
    props.$size === 'small' ? palette.borderRadius.little : palette.borderRadius.medium};
		z-index: -1;

		transition: background-color 0.2s ease-in-out;
	}

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

	/* Border color and gradient */
	background: ${(props) =>
    props.$bordergradient
      ? `conic-gradient(from var(--rotation) at 50% 50%, ${props.$bordergradient.join(', ')}, ${palette.colors.gray[700]}, ${palette.colors.gray[700]}, ${props.$bordergradient[0]})`
      : props.$variant === 'primary'
        ? palette.colors.gray[700]
        : 'transparent'};

	color: ${(props) =>
    props.$variant === 'primary'
      ? palette.colors.white
      : props.$variant === 'secondary'
        ? palette.colors.black
        : props.$variant === 'brand'
          ? palette.colors.white
          : props.$variant === 'ghost'
            ? palette.colors.gray[300]
            : palette.colors.white};
	border-radius: ${palette.borderRadius.little};
	font-weight: ${palette.typography.fontWeight.medium};
	line-height: 1;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	line-height: 1;
	gap: 1ch;
	height: ${(props) =>
    props.$height
      ? `${props.$height}px`
      : props.$size === 'small'
        ? palette.buttonHeights.small
        : props.$size === 'medium'
          ? palette.buttonHeights.medium
          : palette.buttonHeights.large};
	padding-inline: ${(props) =>
    props.$size === 'small' || props.$variant === 'ghost'
      ? palette.space.small
      : palette.space.medium};
	font-size: ${(props) =>
    props.$size === 'small'
      ? palette.typography.fontSize.xs
      : props.$size === 'medium'
        ? palette.typography.fontSize.sm
        : palette.typography.fontSize.base};
	&:hover {
		&::before {
			background-color: ${(props) =>
    props.$variant === 'primary'
      ? palette.colors.gray[900]
      : props.$variant === 'secondary'
        ? palette.colors.gray[200]
        : props.$variant === 'brand'
          ? palette.colors.brand[600]
          : props.$variant === 'ghost'
            ? '#ffffff12'
            : props.$variant + '80'};
		}
		${(props) => props.$bordergradient && `animation: rotate 3s linear infinite paused;`}
	}
	&:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	${(props) =>
		props.$variant === 'pill' &&
		css`
			background-color: #2a2a2a;
			margin-top: 0.25rem;
			margin-right: 0.25rem;
			color: ${palette.colors.text};
			font-size: 0.875rem;
			padding: 0.25rem 0.5rem;
			border-radius: 999px;
			border: 1px solid ${getDotColor(props.$dotstatus)};
			height: auto; /* override default button height */
			padding-inline: 0.5rem;
		`}

	&::after {
		content: '';
		display: ${(props) => (props.$dotstatus ? 'inline-block' : 'none')};
		width: 0.75rem;
		height: 0.75rem;
		background-color: ${(props) => getDotColor(props.$dotstatus)};
		border-radius: 999px;
		margin-left: 0.5rem;
	}
`;

export default Button;
