import React from 'react';
import { createPortal } from 'react-dom';
import styled from 'styled-components';
import LoadingEllipse from '@/assets/success-circle.svg';
import { useTranslation } from 'react-i18next';
import Modal from '.';

type SuccessModalProps = {
  show: boolean;
  setShow: (show: boolean) => void;
  children?: React.ReactNode;
};

const SuccessModal: React.FC<SuccessModalProps> = ({ show, setShow, children }) => {
  const { t } = useTranslation();
  return createPortal(
    <Modal show={show} setShow={setShow} headerStyle={{ border: 'none' }}>
      <SuccessContent>
        <img src={LoadingEllipse} alt={t('modals.success.image.alt')} />
        {children}
      </SuccessContent>
    </Modal>,
    document.body
  );
};

const SuccessContent = styled.div`
	font-family: ${(props) => props.theme.typography.fontFamily.urban};
	font-weight: ${(props) => props.theme.typography.fontWeight.semibold};
	color: ${(props) => props.theme.colors.text.secondary};
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 1.5rem;
	padding-bottom: 1.5rem;
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

export default SuccessModal;
