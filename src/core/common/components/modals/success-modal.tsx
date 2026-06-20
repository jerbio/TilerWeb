import React from 'react';
import { createPortal } from 'react-dom';
import styled from 'styled-components';
import LightLoadingEllipse from '@/assets/success-circle-light.svg';
import DarkLoadingEllipse from '@/assets/success-circle-dark.svg';
import { useTranslation } from 'react-i18next';
import Modal from '.';
import { useTheme } from '@/core/theme/ThemeProvider';
import Button from '../button';

type SuccessModalProps = {
	show: boolean;
	setShow: (show: boolean) => void;
	children?: React.ReactNode;
	closeTimeout?: number;
	actions?: Array<{ text: string; onClick: () => void; disabled?: boolean }>;
};

const SuccessModal: React.FC<SuccessModalProps> = ({
	show,
	setShow,
	children,
	actions,
	closeTimeout,
}) => {
	const { t } = useTranslation();
	const { isDarkMode } = useTheme();
	const loadingEllipse = isDarkMode ? DarkLoadingEllipse : LightLoadingEllipse;

	return createPortal(
		<Modal
			show={show}
			setShow={setShow}
			headerStyle={{ border: 'none' }}
			closeTimeout={closeTimeout}
			footer={
				actions
					? actions.map((action, index) => (
							<SuccessAction
								size="large"
								variant="ghost"
								key={index}
								onClick={action.onClick}
								disabled={action.disabled}
							>
								{action.text}
							</SuccessAction>
						))
					: null
			}
		>
			<SuccessContent>
				<img src={loadingEllipse} alt={t('modals.success.image.alt')} />
				{children}
			</SuccessContent>
		</Modal>,
		document.body
	);
};

const SuccessAction = styled(Button)`
	width: 100%;
	border-radius: ${(props) => props.theme.borderRadius.large};
	outline: 1.5px solid ${(props) => props.theme.colors.border.strong};
	outline-offset: -1.5px;
	color: ${(props) => props.theme.colors.text.secondary};
	font-weight: ${(props) => props.theme.typography.fontWeight.semibold};
	font-family: ${(props) => props.theme.typography.fontFamily.urban};
`;

const SuccessContent = styled.div`
	font-family: ${(props) => props.theme.typography.fontFamily.urban};
	font-weight: ${(props) => props.theme.typography.fontWeight.semibold};
	color: ${(props) => props.theme.colors.text.secondary};
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 1rem;
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
