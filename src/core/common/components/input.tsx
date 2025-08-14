import React from 'react';
import styled from 'styled-components';
import palette from '@/core/theme/palette';

type InputProps = {
  disabled?: boolean;
  variant?: 'default' | 'brand';
  sized?: 'small' | 'medium' | 'large';
  height?: number;
  bordergradient?: Array<string>;
};

type StyledInputProps = {
  $disabled: InputProps['disabled'];
  $variant: InputProps['variant'];
  $sized: InputProps['sized'];
  $height: InputProps['height'];
  $bordergradient: InputProps['bordergradient'];
};

type BaseInputProps = React.InputHTMLAttributes<HTMLInputElement> & InputProps;
const BaseInput: React.FC<BaseInputProps> = ({
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

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & InputProps;
const Textarea: React.FC<TextareaProps> = ({
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
      <StyledTextarea disabled={disabled} {...styledProps} {...props} />
    </StyledInputWrapper>
  );
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
      ? `conic-gradient(from var(--rotation) at 50% 50%, ${props.$bordergradient.join(', ')}, ${palette.colors.gray[700]}, ${palette.colors.gray[700]}, ${props.$bordergradient[0]})`
      : props.$variant === 'brand'
        ? palette.colors.brand[400] + '99'
        : palette.colors.gray[800]};
	border-radius: ${palette.borderRadius.little};

	&:has(input:hover, input:focus) {
		background: ${(props) =>
    props.$bordergradient
      ? `conic-gradient(from var(--rotation) at 50% 50%, ${props.$bordergradient.join(', ')}, ${palette.colors.gray[700]}, ${palette.colors.gray[700]}, ${props.$bordergradient[0]})`
      : props.$variant === 'brand'
        ? palette.colors.brand[400] + 'CC'
        : palette.colors.gray[700]};
	}

	&:has(input:focus) {
		box-shadow: 0 0 0 4px
			${(props) =>
    props.$variant === 'brand'
      ? palette.colors.brand[400] + '33'
      : palette.colors.gray[900]};
	}

	transition:
		background-color 0.2s ease-in-out,
		box-shadow 0.2s ease-in-out;
`;

const StyledInput = styled.input<StyledInputProps>`
	/* Background color */
	background-color: ${palette.colors.gray[900]};
	border: none;
	outline: none;

	width: 100%;
	border-radius: 5px;
	font-weight: ${palette.typography.fontWeight.normal};
	line-height: 1;
	color: ${palette.colors.white};
	height: 100%;

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
		color: ${palette.colors.gray[500]};
	}
`;

const StyledTextarea = styled.textarea<StyledInputProps>`
	/* Background color */
	background-color: ${palette.colors.gray[900]};
	border: none;
	outline: none;
	resize: none; /* Prevent manual resizing */

	width: 100%;
	border-radius: 5px;
	font-weight: ${palette.typography.fontWeight.normal};
	line-height: 1.5;
	color: ${palette.colors.white};
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
		color: ${palette.colors.gray[500]};
		/* Improve placeholder vertical alignment */
		position: relative;
		top: 0;
		line-height: inherit;
		padding: 0;
	}
`;

const Input = Object.assign(BaseInput, { Textarea });
export default Input;
