import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import styled, { useTheme } from 'styled-components';
import { X } from 'lucide-react';

type ModalProps = {
	headerText?: string;
	headerStyle?: React.CSSProperties;
	show: boolean;
	setShow?: (show: boolean) => void;
	children?: React.ReactNode;
	footer?: React.ReactNode;
	closeTimeout?: number;
};

const Modal: React.FC<ModalProps> = ({
	show,
	setShow,
	children,
	headerText = '',
	headerStyle,
	footer,
	closeTimeout,
}) => {
	const theme = useTheme();
	const [intervalId, setIntervalId] = React.useState<number>();
	const [timeLeft, setTimeLeft] = React.useState<number>(closeTimeout ?? 0);
	const timerExists = show && !!setShow && closeTimeout !== undefined;

	function closeModal() {
		setShow?.(false);
		clearInterval(intervalId);
		setTimeLeft(0);
	}

	useEffect(() => {
		if (timerExists) {
			setTimeLeft(closeTimeout);
			const id = window.setInterval(() => {
				setTimeLeft((prev) => prev - 1);
			}, 1000);
			setIntervalId(id);
		}

		return () => clearInterval(intervalId);
	}, [show, setShow, closeTimeout]);

	useEffect(() => {
		if (timeLeft <= 0) {
			closeModal();
		}
	}, [timeLeft, setShow]);

	return createPortal(
		<Overlay onClick={closeModal} $show={show}>
			<ModalContainer onClick={(e) => e.stopPropagation()}>
				<Header style={headerStyle}>
					<h3>{headerText}</h3>
					{setShow && (
						<CloseButtonTimerWrapper
							$isclosing={timerExists}
							closetimeleftratio={timerExists ? timeLeft / closeTimeout : 0}
						>
							<CloseButton onClick={closeModal}>
								<X color={theme.colors.text.secondary} size={16} />
							</CloseButton>
							{timerExists && <CloseButtonTimer>{timeLeft}s</CloseButtonTimer>}
						</CloseButtonTimerWrapper>
					)}
				</Header>
				<ModalBody>{children}</ModalBody>
				{footer && <ModalFooter>{footer}</ModalFooter>}
			</ModalContainer>
		</Overlay>,
		document.body
	);
};

const CloseButtonTimer = styled.div`
	position: absolute;
	bottom: 0;
	left: 50%;
	transform: translate(-50%, calc(100% + 0.25rem));
	font-size: ${(props) => props.theme.typography.fontSize.xs};
	font-weight: ${(props) => props.theme.typography.fontWeight.semibold};
	color: ${(props) => props.theme.colors.text.muted};
`;

const CloseButtonTimerWrapper = styled.div<{ $isclosing: boolean; closetimeleftratio: number }>`
	height: 36px;
	width: 36px;
	margin-left: auto;
	position: relative;
	padding: 0.25rem;
	border-radius: calc(${(props) => props.theme.borderRadius.medium} + 0.125rem);
	background-color: ${(props) =>
		props.$isclosing ? props.theme.colors.border.default : props.theme.colors.background.card};
	isolate: isolate;

	&::after {
		z-index: 0;
		content: '';
		position: absolute;
		inset: 0;
		border-radius: calc(${(props) => props.theme.borderRadius.medium} + 0.125rem);
		background: conic-gradient(
			${(props) => props.theme.colors.text.secondary} 0deg
				${(props) => props.closetimeleftratio * 360}deg,
			/* sector angle */ transparent ${(props) => props.closetimeleftratio * 360}deg 360deg
		);
	}
`;

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
	position: absolute;
	top: 50%;
	left: 50%;
	transform: translate(-50%, -50%);
	z-index: 1;
	height: 32px;
	width: 32px;
	display: flex;
	justify-content: center;
	align-items: center;
	background-color: ${(props) => props.theme.colors.background.card};
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

const ModalFooter = styled.div`
	border-top: 1px solid ${(props) => props.theme.colors.border.default};
	padding: 1rem;
`;
export default Modal;
