import React from 'react';
import styled from 'styled-components';
import palette from '@/core/theme/palette';

type RadioProps = {
  checked?: boolean;
  disabled?: boolean;
  name?: string;
  onChange?: (checked: boolean) => void;
  label?: React.ReactNode;
};

const Radio: React.FC<RadioProps> = ({
  checked = false,
  disabled = false,
  name,
  onChange,
  label,
}) => {
  return (
    <Wrapper $disabled={disabled}>
      <HiddenRadio
        type="radio"
        checked={checked}
        disabled={disabled}
        name={name}
        onChange={(e) => onChange && onChange(e.target.checked)}
      />
      <Circle $checked={checked} />
      {label && <Label>{label}</Label>}
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
	background-color: ${({ theme }) => theme.colors.radio.bg};
	border: 2px solid
		${({ $checked, theme }) =>
    $checked ? theme.colors.radio.borderChecked : theme.colors.radio.border};
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
		background-color: ${({ theme }) => theme.colors.radio.circle};
		transform: translate(-50%, -50%) scale(${({ $checked }) => ($checked ? 1 : 0)});
		transition: transform 0.2s ease-in-out;
	}
`;

const Label = styled.span`
	margin-left: 8px;
	font-size: 16px;
	font-weight: ${palette.typography.fontWeight.semibold};
	color: ${({ theme }) => theme.colors.text.primary};
`;

export default Radio;
