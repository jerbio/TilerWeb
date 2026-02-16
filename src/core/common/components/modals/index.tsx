import React from 'react';
import { createPortal } from 'react-dom';
import styled, { useTheme } from 'styled-components';
import { X } from 'lucide-react';

type ModalProps = {
  headerText?: string;
  headerStyle?: React.CSSProperties;
  show: boolean;
  setShow?: (show: boolean) => void;
  children?: React.ReactNode;
};

const Modal: React.FC<ModalProps> = ({ show, setShow, children, headerText = '', headerStyle }) => {
  const theme = useTheme();

  return createPortal(
    <Overlay onClick={() => setShow?.(false)} $show={show}>
      <ModalContainer onClick={(e) => e.stopPropagation()}>
        <Header style={headerStyle}>
          <h3>{headerText}</h3>
          {setShow && (
            <CloseButton onClick={() => setShow(false)}>
              <X color={theme.colors.text.secondary} size={16} />
            </CloseButton>
          )}
        </Header>
        <ModalBody>{children}</ModalBody>
      </ModalContainer>
    </Overlay>,
    document.body
  );
};

const Header = styled.header`
	height: 48px;
	width: 100%;
	position: sticky;
	top: 0;
	border-bottom: 1px solid ${(props) => props.theme.colors.border.default};
	background-color: ${(props) => props.theme.colors.background.card};
	display: flex;
	align-items: center;
	gap: 0.5rem;
	padding: 0.5rem 1rem;

	h3 {
		font-size: ${(props) => props.theme.typography.fontSize.lg};
		font-family: ${(props) => props.theme.typography.fontFamily.urban};
		font-weight: ${(props) => props.theme.typography.fontWeight.bold};
		color: ${(props) => props.theme.colors.text.primary};
		leading: 1;
	}
`;

const CloseButton = styled.button`
	margin-left: auto;
	height: 32px;
	width: 32px;
	display: flex;
	justify-content: center;
	align-items: center;
	background-color: transparent;
	border: ${(props) => `1px solid ${props.theme.colors.border.default}`};
	border-radius: ${(props) => props.theme.borderRadius.medium};

	&:hover {
		background-color: ${(props) => props.theme.colors.background.card2};
	}
`;

const Overlay = styled.div<{ $show: boolean }>`
	opacity: ${(props) => (props.$show ? 1 : 0)};
	pointer-events: ${(props) => (props.$show ? 'auto' : 'none')};
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.6);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 10000;
	transition: opacity 0.2s ease;
`;

const ModalContainer = styled.div`
	width: 100%;
	max-width: 400px;
	background: ${(props) => props.theme.colors.background.card};
	border-radius: ${(props) => props.theme.borderRadius.large};
	overflow: hidden;
`;

const ModalBody = styled.div`
	padding: 1rem;
`;
export default Modal;
