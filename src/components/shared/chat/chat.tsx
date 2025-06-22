import React from 'react';
import styled from 'styled-components';
import styles from '../../../util/styles';
import Button from '../button';
import {
	ArrowLeft,
	ArrowLeftIcon,
	ChevronLeftIcon,
	EyeClosed,
	Plus,
	X,
	XCircleIcon,
	XIcon,
} from 'lucide-react';
import Input from '../input';
import Logo from '../../icons/logo';

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
  right: .5rem;
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
    font-size: ${styles.typography.fontSize.displayXs};
    font-weight: ${styles.typography.fontWeight.bold};
    color: ${styles.colors.white};
    font-family: ${styles.typography.fontFamily.urban};
    text-align: center;
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

const Chat = ({ onClose }: ChatProps) => {
	return (
		<ChatContainer>
			<ChatHeader>
				<ChatTitle>New Chat</ChatTitle>
				{onClose && (
					<Button variant="ghost" height={32} onClick={onClose}>
						<ChevronLeftIcon size={16} />
						<span>Back</span>
					</Button>
				)}
			</ChatHeader>
			<ChatContent>
				<EmptyChat>
          <Logo size={48} />
          <h3>What would you like to do?</h3>
          <p>Describe a task, We'll handle the tiling. </p>
        </EmptyChat>
			</ChatContent>
			<ChatForm action="">
				<Input
					type="text"
					height={48}
					placeholder="Tell Tiler what you do..."
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

