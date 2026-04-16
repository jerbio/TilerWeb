import React from 'react';
import styled, { css } from 'styled-components';
import palette from '@/core/theme/palette';
import { Status } from '@/core/constants/enums';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'brand' | 'ghost' | string;
  size?: 'small' | 'medium' | 'large';
  height?: number; // Optional height prop for custom button height
  bordergradient?: Array<string>; // Array of colors for border gradient
	dotstatus?: 'parsed' | 'clarification' | 'none' | 'pending' | 'executed' | 'failed' | 'exited' | 'disposed';
};

const getDotColor = (status?: string) => {
	if (status === Status.Parsed) return palette.colors.teal[500]; // teal
	if (status === Status.Clarification) return palette.colors.warning[500]; // yellow
	if (status === Status.None) return palette.colors.gray[300]; // light gray
	if (status === Status.Pending) return palette.colors.blue[500]; // blue
	if (status === Status.Executed) return palette.colors.success[500]; // green
	if (status === Status.Failed) return palette.colors.error[500]; // red
	if (status === Status.Exited) return palette.colors.gray[500]; // gray
	if (status === Status.Disposed) return palette.colors.gray[600]; // deeper gray
	return palette.colors.gray[300]; // default to light gray
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
  ...rest
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
      {...rest}
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
      ? props.theme.colors.button.primary.bg
      : props.$variant === 'secondary'
        ? props.theme.colors.button.secondary.bg
        : props.$variant === 'brand'
          ? props.theme.colors.button.brand.bg
          : props.$variant === 'ghost'
            ? 'transparent'
            : props.$variant};
		border-radius: ${(props) =>
    props.$size === 'small' ? props.theme.borderRadius.little : props.theme.borderRadius.medium};
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
      ? `conic-gradient(from var(--rotation) at 50% 50%, ${props.$bordergradient.join(', ')}, ${props.theme.colors.button.primary.border}, ${props.theme.colors.button.primary.border}, ${props.$bordergradient[0]})`
      : props.$variant === 'primary'
        ? props.theme.colors.button.primary.border
        : 'transparent'};

	color: ${(props) =>
    props.$variant === 'primary'
      ? props.theme.colors.button.primary.text
      : props.$variant === 'secondary'
        ? props.theme.colors.button.secondary.text
        : props.$variant === 'brand'
          ? props.theme.colors.button.brand.text
          : props.$variant === 'ghost'
            ? props.theme.colors.button.ghost.text
            : props.theme.colors.white};
	border-radius: ${props => props.theme.borderRadius.little};
	font-weight: ${props => props.theme.typography.fontWeight.medium};
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
        ? props.theme.buttonHeights.small
        : props.$size === 'medium'
          ? props.theme.buttonHeights.medium
          : props.theme.buttonHeights.large};
	padding-inline: ${(props) =>
    props.$size === 'small' || props.$variant === 'ghost'
      ? props.theme.space.small
      : props.theme.space.medium};
	font-size: ${(props) =>
    props.$size === 'small'
      ? props.theme.typography.fontSize.xs
      : props.$size === 'medium'
        ? props.theme.typography.fontSize.sm
        : props.theme.typography.fontSize.base};
	&:hover {
		&::before {
			background-color: ${(props) =>
    props.$variant === 'primary'
      ? props.theme.colors.button.primary.bgHover
      : props.$variant === 'secondary'
        ? props.theme.colors.button.secondary.bgHover
        : props.$variant === 'brand'
          ? props.theme.colors.button.brand.bgHover
          : props.$variant === 'ghost'
            ? props.theme.colors.button.ghost.bgHover
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
			color: ${props => props.theme.colors.text};
			font-size: 0.875rem;
			padding: 0.25rem 0.5rem;
			border-radius: 999px;
			border: 1px solid ${getDotColor(props.$dotstatus)};
			height: auto; /* override default button height */
			padding-inline: 0.5rem;
			display: flex;
			align-items: center;
			max-width: 200px;
			position: relative;

			/* Icon and dash should not shrink */
			& > img,
			& > span:not(.action-description) {
				flex-shrink: 0;
			}

			/* Add smooth transitions for elegant expansion */
			transition: max-width 3s ease-out, box-shadow 0.5s ease, transform 3s ease-out;

			/* Only truncate the action description */
			& .action-description {
				overflow: hidden;
				white-space: nowrap;
				text-overflow: ellipsis;
				min-width: 0; /* Allow flex item to shrink below content size */
				transition: all 0.5s ease-out;
				display: inline-block;
			}

			&:hover {
				max-width: 400px; /* Set a specific target width instead of none */
				z-index: 10;
				box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
				transform: scale(1.02); /* Slight scale for visual feedback */

				& .action-description {
					overflow: visible;
					white-space: normal;
					word-break: break-word;
					max-width: none;
				}
			}
			
			/* Ensure status dot maintains proper size and positioning */
			&::after {
				flex-shrink: 0;
				width: 0.75rem !important;
				height: 0.75rem !important;
				margin-left: 0.5rem;
			}
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
