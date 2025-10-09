import React from 'react';
import { useState } from 'react';
import { useSpring, animated } from '@react-spring/web';
import styled, { css } from 'styled-components';
import palette from '@/core/theme/palette';

type TooltipPosition = 'top' | 'bottom' | 'left' | 'right';

type TooltipProps = {
  text: string;
  children: React.ReactNode;
  position?: TooltipPosition;
};

const Tooltip: React.FC<TooltipProps> = ({ text, children, position = 'top' }) => {
  const [show, setShow] = useState(false);

  const styles = useSpring({
    opacity: show ? 1 : 0,
    transform: show
      ? 'translate(0px, 0px)'
      : position === 'top'
        ? 'translateY(5px)'
        : position === 'bottom'
          ? 'translateY(-5px)'
          : position === 'left'
            ? 'translateX(5px)'
            : 'translateX(-5px)',
    config: { tension: 250, friction: 20 },
  });

  return (
    <Wrapper onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      {children}
      <Bubble style={styles} position={position}>
        {text}
      </Bubble>
    </Wrapper>
  );
};

const Wrapper = styled.div`
	position: relative;
	display: inline-block;
`;

const Bubble = styled(animated.div) <{ position: TooltipPosition }>`
	position: absolute;
	background: ${palette.colors.gray[800]};
	color: ${palette.colors.gray[200]};
	font-size: 0.75rem;
	padding: 6px 10px;
	border-radius: 6px;
	z-index: 100;
	pointer-events: none;
	max-width: 200px;
	width: max-content;

	${({ position }) =>
    position === 'top' &&
    css`
			bottom: 120%;
			left: 50%;
			transform: translateX(-50%);
		`}

	${({ position }) =>
    position === 'bottom' &&
    css`
			top: 120%;
			left: 50%;
			transform: translateX(-50%);
		`}

  ${({ position }) =>
    position === 'left' &&
    css`
			right: 110%;
			top: 50%;
			transform: translateY(-50%);
		`}

  ${({ position }) =>
    position === 'right' &&
    css`
			left: 110%;
			top: 50%;
			transform: translateY(-50%);
		`}
`;
export default Tooltip;
