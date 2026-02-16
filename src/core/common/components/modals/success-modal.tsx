import React from 'react';
import { createPortal } from 'react-dom';
import styled, { useTheme } from 'styled-components';
import LoadingEllipse from '@/assets/success-circle.svg';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

type SuccessModalProps = {
  show: boolean;
  setShow: (show: boolean) => void;
  children?: React.ReactNode;
};

const SuccessModal: React.FC<SuccessModalProps> = ({ show, setShow, children }) => {
  const { t } = useTranslation();
  const theme = useTheme();
  return createPortal(
    <Overlay onClick={() => setShow(false)} $show={show}>
      <Content onClick={(e) => e.stopPropagation()}>
        <CloseButton onClick={() => setShow(false)}>
          <X color={theme.colors.text.secondary} size={24} />
        </CloseButton>
        <img src={LoadingEllipse} alt={t('modals.success.image.alt')} />
        {children}
      </Content>
    </Overlay>,
    document.body
  );
};

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

const Content = styled.div`
	width: 100%;
	max-width: 400px;
	font-family: ${(props) => props.theme.typography.fontFamily.urban};
	font-weight: ${(props) => props.theme.typography.fontWeight.semibold};
	color: ${(props) => props.theme.colors.text.secondary};
	background: ${(props) => props.theme.colors.background.card};
	border-radius: ${(props) => props.theme.borderRadius.large};
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 1.5rem;
	padding: 2rem;
	text-align: center;
	position: relative;
	p {
		max-width: 250px;
	}

	b {
		font-weight: ${(props) => props.theme.typography.fontWeight.bold};
		color: ${(props) => props.theme.colors.text.primary};
	}
`;

const CloseButton = styled.button`
	position: absolute;
	top: 1rem;
	right: 1rem;
	height: 36px;
	width: 36px;
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

export default SuccessModal;
