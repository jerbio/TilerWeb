import React from 'react';
import styled from 'styled-components';

interface ToggleProps {
	label: string;
	isOn: boolean;
	onChange: (value: boolean) => void;
	disabled?: boolean;
}

const Toggle: React.FC<ToggleProps> = ({ label, isOn, onChange, disabled = false }) => {
	const handleClick = () => {
		if (!disabled) {
			onChange(!isOn);
		}
	};

	return (
		<ToggleRow>
			<ToggleLabel>{label}</ToggleLabel>
			<ToggleSwitch $isOn={isOn} $disabled={disabled} onClick={handleClick}>
				<ToggleKnob $isOn={isOn} />
			</ToggleSwitch>
		</ToggleRow>
	);
};

const ToggleRow = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 1.5rem 0;
	border-bottom: 1px solid ${({ theme }) => theme.colors.border.subtle};

	&:last-child {
		border-bottom: none;
	}
`;

const ToggleLabel = styled.label`
	font-size: ${({ theme }) => theme.typography.fontSize.base};
	color: ${({ theme }) => theme.colors.text.primary};
	font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
`;

const ToggleSwitch = styled.button<{ $isOn: boolean; $disabled?: boolean }>`
	position: relative;
	width: 48px;
	height: 28px;
	background-color: ${({ $isOn, theme }) =>
		$isOn ? theme.colors.brand[500] : theme.colors.gray[700]};
	border: none;
	border-radius: 14px;
	cursor: ${({ $disabled }) => ($disabled ? 'not-allowed' : 'pointer')};
	transition: background-color 0.2s ease;
	padding: 0;
	margin: 0;
	box-sizing: border-box;
	opacity: ${({ $disabled }) => ($disabled ? 0.5 : 1)};
	display: flex;
	align-items: center;

	&:hover {
		background-color: ${({ $disabled, $isOn, theme }) =>
			$disabled
				? $isOn
					? theme.colors.brand[500]
					: theme.colors.gray[700]
				: $isOn
					? theme.colors.brand[400]
					: theme.colors.gray[600]};
	}
`;

const ToggleKnob = styled.div<{ $isOn: boolean }>`
	width: 22px;
	height: 22px;
	background-color: ${({ theme }) => theme.colors.background.card};
	border-radius: 50%;
	transition: margin-left 0.2s ease;
	margin-left: ${({ $isOn }) => ($isOn ? '23px' : '3px')};
	flex-shrink: 0;
`;

export default Toggle;
