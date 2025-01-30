import React from 'react';
import styled from 'styled-components';
import styles from './styles';

interface ButtonProps {
    children: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    primary?: boolean;
    width?: string;
}

const StyledButton = styled.button<ButtonProps>`
    background-color: ${props => props.primary ? '#007bff' : '#6c757d'};
    color: white;
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 0.25rem;
    cursor: pointer;
    font-size: 1rem;
    width: ${props => props.width === 'small' ? styles.buttonWidths.small : props.width === 'large' ? styles.buttonWidths.large : styles.buttonWidths.medium};
    &:hover {
        background-color: ${props => props.primary ? styles.colors.primary : styles.colors.secondary};
    }
    &:disabled {
        background-color: ${styles.colors.background};
        cursor: not-allowed;
    }
`;

const Button: React.FC<ButtonProps> = ({ children, onClick, disabled = false, primary = false, width = "medium" }) => {
    return (
        <StyledButton onClick={onClick} disabled={disabled} primary={primary} width={width}>
            {children}
        </StyledButton>
    );
};

export default Button;