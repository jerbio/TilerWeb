import React from 'react';
import styled from 'styled-components';
import styles from '../../util/styles';

interface ButtonProps {
	children: React.ReactNode;
	onClick?: () => void;
	disabled?: boolean;
	primary?: boolean | string;
	width?: string;
}

const StyledButton = styled.button<ButtonProps>`
	background-color: ${(props) => {
		if (typeof props.primary === 'boolean' && props.primary) {
			return styles.colors.buttonPrimary;
		} else if (typeof props.primary === 'boolean') {
			return styles.colors.buttonSecondary;
		}
		return props.primary;
	}};
	color: ${(props) =>
		props.primary
			? styles.colors.buttonSecondary
			: styles.colors.buttonPrimary};
	padding: 0; // Olamide TODO: create a getPadding function for custom padding values. THe default should not be zero.
	border: none;
	border-radius: 0.25rem;
	cursor: pointer;
	font-size: ${styles.typography.fontSize.xs};
	font-family: ${styles.typography.fontFamily.inter};
	height: ${styles.buttonHeights.medium};
	width: ${(props) =>
		props.width === 'small'
			? styles.buttonWidths.small
			: props.width === 'large'
				? styles.buttonWidths.large
				: props.width === 'large'
					? styles.buttonWidths.medium
					: props.width};
	&:hover {
		background-color: ${(props) => {
			if (typeof props.primary === 'boolean' && props.primary) {
				return styles.colors.buttonSecondary;
			} else if (typeof props.primary === 'boolean') {
				return styles.colors.buttonPrimary;
			}
			return props.primary;
		}};
		color: ${(props) =>
			props.primary
				? styles.colors.buttonPrimary
				: styles.colors.buttonSecondary};
	}
	&:disabled {
		background_color: ${styles.colors.background};
		cursor: not-allowed;
	}
`;

const Button: React.FC<ButtonProps> = ({
	children,
	onClick,
	disabled = false,
	primary = false,
	width = 'medium',
}) => {
	return (
		<StyledButton
			onClick={onClick}
			disabled={disabled}
			primary={primary}
			width={width}
		>
			{children}
		</StyledButton>
	);
};

export default Button;
