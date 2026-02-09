import React from 'react';
import { useLayoutEffect, useRef, useState } from 'react';
import styled from 'styled-components';

type AutosizeInputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  minWidth?: number;
  maxWidth?: number;
	value?: string;
  style?: React.CSSProperties;
};

const Input = styled.input`
	font: inherit;
	background: none;
	border: none;
	color: inherit;
	outline: none;
	width: 100%;
`;

const Mirror = styled.span`
	position: absolute;
	visibility: hidden;
	white-space: pre;
	font: inherit;
	padding: 0;
	margin: 0;
	border: 0;
`;

const AutosizeInput: React.FC<AutosizeInputProps> = ({
  minWidth = 40,
  maxWidth = 400,
  value = '',
  style,
  ...props
}) => {
  const mirrorRef = useRef<HTMLSpanElement>(null);
  const [width, setWidth] = useState(minWidth);

  useLayoutEffect(() => {
    if (!mirrorRef.current) return;

    const textWidth = mirrorRef.current.offsetWidth;
    const nextWidth = Math.min(
      maxWidth,
      Math.max(minWidth, textWidth + 2) // caret breathing room
    );

    setWidth(nextWidth);
  }, [value, minWidth, maxWidth]);

  return (
    <>
      <Input
        {...props}
        value={value}
        style={{
          width,
          ...style,
        }}
      />
      <Mirror ref={mirrorRef}>{value || ' '}</Mirror>
    </>
  );
}

export default AutosizeInput;
