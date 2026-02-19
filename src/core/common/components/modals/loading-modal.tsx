import React from 'react';
import { createPortal } from 'react-dom';
import styled from 'styled-components';
import LoadingEllipse from '@/assets/loading-ellipse.svg';
import Logo from '../icons/logo';
import { useTranslation } from 'react-i18next';
import Modal from '.';

type LoadingModalProps = {
  show: boolean;
  setShow: (show: boolean) => void;
  children?: React.ReactNode;
};

const LoadingModal: React.FC<LoadingModalProps> = ({ show, children }) => {
  const { t } = useTranslation();

  return createPortal(
    <Modal show={show} headerStyle={{ display: 'none' }}>
      <Content>
        <LoadingIcon>
          <img src={LoadingEllipse} alt={t('modals.loading.image.alt')} />
          <Logo size={30} />
        </LoadingIcon>
        {children}
      </Content>
    </Modal>,
    document.body
  );
};

const LoadingIcon = styled.div`
	display: grid;
	height: 100px;
	width: 100px;
	place-content: center;
	place-items: center;
	gap: 1rem;

	& > * {
		grid-row: 1/2;
		grid-column: 1/2;
	}

	& > img {
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		0% {
			transform: rotate(0deg);
		}
		100% {
			transform: rotate(360deg);
		}
	}
`;

const Content = styled.div`
	width: 100%;
	font-family: ${(props) => props.theme.typography.fontFamily.urban};
	font-weight: ${(props) => props.theme.typography.fontWeight.semibold};
	color: ${(props) => props.theme.colors.text.secondary};
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 1.5rem;
	padding-block: 1.5rem;
	text-align: center;

	p {
		max-width: 250px;
	}

	b {
		font-weight: ${(props) => props.theme.typography.fontWeight.bold};
		color: ${(props) => props.theme.colors.text.primary};
	}
`;

export default LoadingModal;
