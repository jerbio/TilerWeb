import React from "react";
import styled from "styled-components";
import styles from "../../util/styles";

type InputProps = React.HTMLAttributes<HTMLInputElement> & {
  variant?: 'default' | 'brand';
  size?: 'small' | 'medium' | 'large';
  borderGradient?: Array<string>; // Array of colors for border gradient
};

const StyledInput = styled.input<InputProps>`
  /* Background color */
  position: relative;
  isolation: isolate;
  background-color: ${styles.colors.gray[900]};
  border: none;

  /* Border color and gradient */
  &::before {
    content: '';
    position: absolute;
    inset: 1px;
    background: ${(props) =>
      props.variant === 'default'
        ? '#f0f0f0'
        : props.variant === 'brand'
          ? '#007bff'
          : props.variant};
    border-radius: ${(props) =>
      props.size === 'small'
        ? '4px'
        : props.size === 'medium'
          ? '6px'
          : '8px'};
    z-index: -1;
  }
`

const Input: React.FC<InputProps> = ({ ...props }) => {
  return (
    <StyledInput
      {...props}
    />
  );
};

export default Input;