import React from 'react';
import styled from 'styled-components';
import palette from '@/core/theme/palette';

type RadioProps = {
  checked?: boolean;
  disabled?: boolean;
  name?: string;
  onChange?: () => void;
};

const Radio: React.FC<RadioProps> = ({
  checked = false,
  disabled = false,
  name,
  onChange,
}) => {
  return (
    <Wrapper $disabled={disabled}>
      <HiddenRadio
        type="radio"
        checked={checked}
        disabled={disabled}
        name={name}
        onChange={onChange}
      />
      <Circle $checked={checked} />
    </Wrapper>
  );
};

const Wrapper = styled.label<{ $disabled: boolean }>`
	display: inline-flex;
	align-items: center;
	cursor: ${({ $disabled }) => ($disabled ? 'not-allowed' : 'pointer')};
	opacity: ${({ $disabled }) => ($disabled ? 0.6 : 1)};
`;

const HiddenRadio = styled.input`
	position: absolute;
	opacity: 0;
	pointer-events: none;
`;

const Circle = styled.div<{ $checked: boolean }>`
	position: relative;
	width: 20px;
	height: 20px;
	border-radius: 50%;
	background-color: ${palette.colors.gray[800]};
	border: 2px solid
		${({ $checked }) =>
			$checked ? palette.colors.brand[400] : palette.colors.gray[600]};
	transition:
		border-color 0.2s ease-in-out,
		background-color 0.2s ease-in-out;

	&::after {
		content: '';
		position: absolute;
		top: 50%;
		left: 50%;
		width: 10px;
		height: 10px;
		border-radius: 50%;
		background-color: ${palette.colors.brand[400]};
		transform: translate(-50%, -50%) scale(${({ $checked }) => ($checked ? 1 : 0)});
		transition: transform 0.2s ease-in-out;
	}
`;

export default Radio;
