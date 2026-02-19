import React from 'react';
import styled from 'styled-components';

type ToggleProps = {
  checked?: boolean;
  disabled?: boolean;
  onChange?: (checked: boolean) => void;
};

const Toggle: React.FC<ToggleProps> = ({ checked = false, disabled = false, onChange }) => {
  return (
    <Wrapper $disabled={disabled}>
      <HiddenCheckbox
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange?.(e.target.checked)}
      />
      <Switch $checked={checked} />
    </Wrapper>
  );
};

const Wrapper = styled.label<{ $disabled: boolean }>`
	display: inline-flex;
	cursor: ${({ $disabled }) => ($disabled ? 'not-allowed' : 'pointer')};
	opacity: ${({ $disabled }) => ($disabled ? 0.6 : 1)};
`;

const HiddenCheckbox = styled.input`
	position: absolute;
	opacity: 0;
	pointer-events: none;
`;

const Switch = styled.div<{ $checked: boolean }>`
	position: relative;
	width: 44px;
	height: 24px;
	border-radius: 999px;
	background-color: ${(props) =>
    props.$checked ? props.theme.colors.toggle.bgChecked : props.theme.colors.toggle.bg};
	transition: background-color 0.25s ease-in-out;

	&::after {
		content: '';
		position: absolute;
		top: 2px;
		left: 2px;
		width: 20px;
		height: 20px;
		border-radius: 50%;
		background-color: ${(props) =>
    props.$checked
      ? props.theme.colors.toggle.circleChecked
      : props.theme.colors.toggle.circle};
		box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
		transform: ${({ $checked }) => ($checked ? 'translateX(20px)' : 'translateX(0)')};
		transition: transform 0.25s ease-in-out;
	}
`;

export default Toggle;
