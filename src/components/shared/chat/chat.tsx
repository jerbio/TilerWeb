import React, { useEffect, useState, FormEvent, useRef } from 'react';
import styled from 'styled-components';
import styles from '../../../util/styles';
import Button from '../button';
import { ChevronLeftIcon, Plus } from 'lucide-react';
import Input from '../input';
import Logo from '../../icons/logo';
import { Prompt } from './util/chat';
import {
	fetchChatMessages,
	sendChatMessage,
	getStoredSessionId,
	clearStoredSessionId,
} from './util/chat_service';
import useAppStore from '../../../global_state'; // Import Zustand Global State

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

const Chat = ({ onClose }: ChatProps) => {
	const messagesEndRef = useRef<HTMLDivElement>(null);
	const [messages, setMessages] = useState<Prompt[]>([]);
	const [message, setMessage] = useState('');
	const [isSending, setIsSending] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [sessionId, setSessionId] = useState<string>('');
	const [isLoading, setIsLoading] = useState(false);

	// Load session ID from local storage on mount
	useEffect(() => {
		const storedSessionId = getStoredSessionId();
		if (storedSessionId) {
			setSessionId(storedSessionId);
		}
	}, []);

	// Load chat messages when session ID changes
	useEffect(() => {
		if (sessionId) {
			loadChatMessages(sessionId);
		}
	}, [sessionId]);

	const loadChatMessages = async (sid: string) => {
		if (!sid) return;
		try {
			setIsLoading(true);
			setError(null);
			const data = await fetchChatMessages(sid);
			// Convert the fetched messages to our Message format
			if (data.Content?.chats) {
				const loadedMessages = data.Content.chats;
				setMessages(loadedMessages);
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to load chat messages');
		} finally {
			setIsLoading(false);
		}
	};

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault();
		if (!message.trim() || isSending) return;

		try {
			setIsSending(true);
			setError(null);
			const response = await sendChatMessage(message, sessionId);

			const responseMessages: Prompt[] = [];
			const actions = response?.Content?.vibeResponse?.actions || [];
			for (const action of actions) {
				if (action && action.prompts && action.prompts.length > 0) {
					for (const prompt of action.prompts) {
						responseMessages.push(prompt);
					}
				}
			}
			const pendingActions = response?.Content?.vibeResponse?.pendingActions || [];
			for (const action of pendingActions) {
				if (action && action.prompts && action.prompts.length > 0) {
					for (const prompt of action.prompts) {
						responseMessages.push(prompt);
					}
				}
			}
			responseMessages.sort((a, b) => a.id.localeCompare(b.id));
			responseMessages.reverse();
			setMessages((prev) => [...responseMessages, ...prev]);

			// Update session ID if this was the first message
			const sessionIdFromResponse = responseMessages[0]?.sessionId;
			if (sessionIdFromResponse) {
				setSessionId(sessionIdFromResponse);
			}

			// Clear input field after successful response
			setMessage('');
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to send message');
		} finally {
			setIsSending(false);
		}
	};

	const handleNewChat = () => {
		clearStoredSessionId();
		setSessionId('');
		setError(null);
		setMessage('');
		setMessages([]);
	};

	// Zustand store state and actions
	const chatContext = useAppStore((state) => state.chatContext); // Access chatContext
	const removeChatContext = useAppStore((state) => state.removeChatContext); // Action to remove context

	const handleRemoveContext = (context: string) => {
		removeChatContext(context); // Remove the clicked context
	};

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
				{isLoading && <div className="chat-loading">Loading chat messages...</div>}
				{error && <div className="chat-error">Error: {error}</div>}
				{!isLoading && !error && !messages.length && (
					<EmptyChat>
						<Logo size={48} />
						<h3>What would you like to do?</h3>
						<p>Describe a task, We&apos;ll handle the tiling. </p>
					</EmptyChat>
				)}
			</ChatContent>

			{/* Render chatContext buttons */}
			<div style={{ marginBottom: '1rem' }}>
				{chatContext.map((context, index) => (
					<Button
						key={index}
						variant="outline"
						style={{
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'space-between',
							marginBottom: '0.5rem',
							padding: '0.5rem 1rem',
						}}
					>
						<span>{context}</span>
						<span
							onClick={() => handleRemoveContext(context)}
							style={{ marginLeft: '0.5rem', color: 'red', cursor: 'pointer' }}
						>
							x
						</span>
					</Button>
				))}
			</div>

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
