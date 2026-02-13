import React from 'react';
import { createPortal } from 'react-dom';
import styled from 'styled-components';
import LoadingEllipse from '@/assets/loading-ellipse.svg';
import Logo from '../icons/logo';

type LoadingModalProps = {
  show: boolean;
  setShow: (show: boolean) => void;
  children?: React.ReactNode;
};

const LoadingModal: React.FC<LoadingModalProps> = ({ show, children }) => {
  return createPortal(
    <Overlay $show={show}>
      <Content>
        <LoadingIcon>
          <img src={LoadingEllipse} alt="Loading Ellipse" />
          <Logo size={30} />
        </LoadingIcon>
        {children}
      </Content>
    </Overlay>,
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
	p {
		max-width: 250px;
	}

	b {
		font-weight: ${(props) => props.theme.typography.fontWeight.bold};
		color: ${(props) => props.theme.colors.text.primary};
	}
`;

export default LoadingModal;
