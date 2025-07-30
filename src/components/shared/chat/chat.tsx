import React from 'react';
import styled from 'styled-components';
import styles from '../../../util/styles';
import Button from '../button';
import { ChevronLeftIcon, Plus } from 'lucide-react';
import Input from '../input';
import Logo from '../../icons/logo';
import { useTranslation } from 'react-i18next';

const ChatContainer = styled.section`
	display: flex;
	flex-direction: column;
	gap: 1rem;
	height: 100%;
	padding: 1.5rem;

	@media screen and (min-width: ${styles.screens.lg}) {
		padding: 0;
	}
`;

const ChatHeader = styled.header`
	display: flex;
	justify-content: space-between;
	align-items: center;

	@media screen and (min-width: ${styles.screens.lg}) {
		padding: 0.75rem 0;
	}
`;

const ChatTitle = styled.h2`
	font-family: 'Urbanist', sans-serif;
	font-size: ${styles.typography.fontSize.lg};
	font-weight: ${styles.typography.fontWeight.bold};
	line-height: 1;
	color: ${styles.colors.gray[300]};
`;

const ChatContent = styled.div`
	flex: 1;
`;

const ChatForm = styled.form`
	position: relative;
`;

const ChatButton = styled.button`
	position: absolute;
	top: 50%;
	transform: translateY(-50%);
	right: 0.5rem;
	height: 1.5rem;
	width: 1.5rem;
	display: grid;
	place-items: center;
	border-radius: ${styles.borderRadius.xxLarge};
	background-color: ${styles.colors.white};
	color: ${styles.colors.brand[500]};
`;

const EmptyChat = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 0.5rem;
	height: 100%;

	h3 {
		font-size: ${styles.typography.fontSize.xl};
		font-weight: ${styles.typography.fontWeight.bold};
		color: ${styles.colors.white};
		font-family: ${styles.typography.fontFamily.urban};
		text-align: center;

		@media screen and (min-width: ${styles.screens.lg}) {
			h3 {
				font-size: ${styles.typography.fontSize.displayXs};
			}
		}
	}

	p {
		font-size: ${styles.typography.fontSize.sm};
		color: ${styles.colors.gray[500]};
		font-weight: ${styles.typography.fontWeight.medium};
		text-align: center;
	}
`;

type ChatProps = {
	onClose?: () => void;
};

const Chat : React.FC = ({ onClose }: ChatProps) => {
	const { t } = useTranslation();

	return (
		<ChatContainer>
			<ChatHeader>
				<ChatTitle>{t('home.expanded.chat.newChat')}</ChatTitle>
				{onClose && (
					<Button variant="ghost" height={32} onClick={onClose}>
						<ChevronLeftIcon size={16} />
						<span>{t('common.buttons.back')}</span>
					</Button>
				)}
			</ChatHeader>
			<ChatContent>
				<EmptyChat>
					<Logo size={48} />
					<h3>{t('home.expanded.chat.title')}</h3>
					<p>{t('home.expanded.chat.subtitle')}</p>
				</EmptyChat>
			</ChatContent>
			<ChatForm action="">
				<Input
					type="text"
					height={48}
					placeholder={t('home.expanded.chat.inputPlaceholder')}
					borderGradient={[styles.colors.brand[500]]}
				/>
				<ChatButton type="submit">
					<Plus size={20} />
				</ChatButton>
			</ChatForm>
		</ChatContainer>
	);
};

export default Chat;
