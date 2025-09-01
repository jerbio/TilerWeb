import React from 'react';
import styled from 'styled-components';
import palette from '@/core/theme/palette';

type InputProps = {
  label?: React.ReactNode;
  disabled?: boolean;
  variant?: 'default' | 'brand';
  sized?: 'small' | 'medium' | 'large';
  height?: number;
  bordergradient?: Array<string>;
  prepend?: React.ReactNode;
  searchList?: Array<string>;
};

type StyledInputProps = {
  $label: InputProps['label'];
  $disabled: InputProps['disabled'];
  $variant: InputProps['variant'];
  $sized: InputProps['sized'];
  $height: InputProps['height'];
  $bordergradient: InputProps['bordergradient'];
  $prepend?: InputProps['prepend'];
};

export type BaseInputProps = React.InputHTMLAttributes<HTMLInputElement> & InputProps;
const BaseInput: React.FC<BaseInputProps> = ({
  disabled = false,
  variant = 'default',
  sized = 'medium',
  height,
  bordergradient,
  label,
  prepend,
	searchList,
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
  };
  const id = label ? `input-${Math.random().toString(36).substring(2, 9)}` : undefined;
	const listId = searchList ? `${id}-list` : undefined;
  const styledInput = (
    <StyledInputWrapper {...styledProps}>
      {prepend && <StyledInputPrepend>{prepend}</StyledInputPrepend>}
			{searchList && <datalist id={listId}>
				{searchList.map((item) => (
					<option value={item} key={item} />
				))}
			</datalist>}
      <StyledInput id={id} disabled={disabled} {...styledProps} {...props} list={listId} />
    </StyledInputWrapper>
  );

  return label ? (
    <div>
      <StyledLabel htmlFor={id} {...styledProps}>
        {label}
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

const StyledLabel = styled.label<StyledInputProps>`
	display: block;
	margin-bottom: 6px;
	font-size: ${(props) =>
    props.$sized === 'small'
      ? palette.typography.fontSize.xs
      : props.$sized === 'medium'
        ? palette.typography.fontSize.xs
        : palette.typography.fontSize.sm};
	font-weight: ${palette.typography.fontWeight.medium};
	color: ${palette.colors.gray[400]};
`;

const StyledInputPrepend = styled.div`
	position: absolute;
	height: 100%;
	width: 40px;
	display: flex;
	justify-content: center;
	align-items: center;
	pointer-events: none;
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
      ? `conic-gradient(from var(--rotation) at 50% 50%, ${props.$bordergradient.join(', ')}, ${palette.colors.gray[700]}, ${palette.colors.gray[700]}, ${props.$bordergradient[0]})`
      : props.$variant === 'brand'
        ? palette.colors.brand[400] + '99'
        : palette.colors.gray[800]};
	border-radius: ${palette.borderRadius.little};

	${StyledInputPrepend} {
		color: ${palette.colors.gray[500]};
		transition: color 0.2s ease-in-out;
	}

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

		${StyledInputPrepend} {
			color: ${palette.colors.brand[400]};
		}
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

	padding-left: calc(
		${(props) => (props.$sized === 'small' ? palette.space.small : palette.space.medium)} -
			6px + ${(props) => (props.$prepend ? '20px' : '0px')}
	);
	padding-right: calc(
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
