import { a, useSpring } from '@react-spring/web';
import React from 'react';
import styled from 'styled-components';

type CalendarModalProps = {
  open: boolean;
  onBackdropClick?: () => void;
  containerRef?: React.RefObject<HTMLDivElement>;
  children?: React.ReactNode;
	width?: number
};

const CalendarModal: React.FC<CalendarModalProps> = ({
  children,
  containerRef,
  onBackdropClick,
  open,
  width
}) => {
  const modalPopooutAnimation = useSpring({
    from: {
      opacity: 0,
      scale: 0.9,
      y: 0,
    },
    to: {
      opacity: open ? 1 : 0,
      scale: open ? 1 : 0.9,
      y: open ? 0 : 100,
    },
    config: {
      duration: 200,
    },
  });

  return (
    <ModalBackdrop $visible={open} onClick={onBackdropClick}>
      <ModalWrapper>
        <ModalContainer
					$width={width}
          ref={containerRef}
          style={{
            scale: modalPopooutAnimation.scale,
            opacity: modalPopooutAnimation.opacity,
            transform: modalPopooutAnimation.y.to(
              (y) => `translate(-50%, calc(${y}px - 50%))`
            ),
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {children}
        </ModalContainer>
      </ModalWrapper>
    </ModalBackdrop>
  );
};

const ModalBackdrop = styled.div<{ $visible: boolean }>`
	position: absolute;
	top: 0;
	left: 0;
	z-index: 2;
	isolation: isolate;
	width: 100%;
	height: 100%;
	background-color: ${({ theme }) => theme.colors.backdrop.glass};
	backdrop-filter: blur(4px);
	opacity: ${({ $visible }) => ($visible ? 1 : 0)};
	pointer-events: ${({ $visible }) => ($visible ? 'auto' : 'none')};
	transition: opacity 0.3s ease-in-out;
`;

const ModalWrapper = styled.div`
	position: relative;
	width: 100%;
	height: 100%;
`;

const ModalContainer = styled(a.div)<{ $width?: number }>`
	position: absolute;
	top: 50%;
	left: 50%;
	z-index: 1001;
	width: calc(100% - 32px);
	max-width: ${({ $width }) => $width ? `${$width}px` : '600px'};
`;

export default CalendarModal;
