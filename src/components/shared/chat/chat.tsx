import React, { useEffect, useState, FormEvent, useRef } from 'react';
import styled from 'styled-components';
import styles from '../../../util/styles';
import Button from '../button';
import { ChevronLeftIcon, Plus } from 'lucide-react';
import Input from '../input';
import Logo from '../../icons/logo';
import { useTranslation } from 'react-i18next';
import { Prompt } from './util/chat';
import {
	fetchChatMessages,
	fetchChatActions,
	sendChatMessage,
	getStoredSessionId,
	setStoredSessionId,
	clearStoredSessionId,
} from './util/chat_service';
import useAppStore from '../../../global_state'; // Import Zustand Global State
import { ChatContextType } from '../../../global_state'; // Import ChatContextType
import { Actions, Status } from '../../../util/enums'; // Import the enums

const ChatContainer = styled.section`
	display: flex;
	flex-direction: column;
	// gap: 1rem;
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
	display: flex;
	flex-direction: column;
	height: 100%;
	overflow: hidden;
	max-height: 400px;

	.messages-list {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 1rem;
		overflow-y: auto;
	}
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

const MessageBubble = styled.div<{ $isUser: boolean }>`
	display: flex;
	flex-direction: column;
	align-items: ${({ $isUser }) => ($isUser ? 'flex-end' : 'flex-start')};
	text-align: ${({ $isUser }) => ($isUser ? 'right' : 'left')};
	margin: 0.5rem 0;

	.message-content {
		background-color: ${({ $isUser }) => ($isUser ? '#2a2a2a' : '#c20f31')};
		color: #ffffff;
		padding: 0.75rem 1rem;
		border-radius: 1rem;
		max-width: 70%;
		word-wrap: break-word;
	}
`;

type ChatProps = {
	onClose?: () => void;
};

type Action = {
	id: string;
	descriptions: string;
	type: string;
	creationTimeInMs: number;
	status: string;
	beforeScheduleId: string;
	afterScheduleId: string;
	vibeRequest: {
		id: string;
		creationTimeInMs: number;
		activeAction: string | null;
		isClosed: boolean;
		actions: any[];
	};
};

type PromptWithActions = {
	id: string;
	origin: string;
	content: string;
	actionId: string | null;
	requestId: string;
	sessionId: string;
	actions: Action[];
	actionIds?: string[]; // Optional array of action IDs
};

const Chat = ({ onClose }: ChatProps) => {
	const { t } = useTranslation();

	const chatContext = useAppStore((state) => state.chatContext); // Access chatContext
	const setScheduleId = useAppStore((state) => state.setScheduleId); // Action to set the schedule ID
	const messagesEndRef = useRef<HTMLDivElement>(null);
	const [message, setMessage] = useState('');
	const [messages, setMessages] = useState<PromptWithActions[]>([]);
	const [isSending, setIsSending] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [sessionId, setSessionId] = useState<string>('');
	const [isLoading, setIsLoading] = useState(false);
	const entityId = chatContext.length > 0 ? chatContext[0].EntityId : ''; // Get EntityId from chatContext

	const scheduleId = useAppStore((state) => state.scheduleId);
	// console.log('Current Schedule ID:', scheduleId);
	const [count, setCount] = useState(0);
	const randomStrings = Array.from({ length: 20 }, () =>
		Math.random().toString(36).substring(2, 10)
	);
	const handleSetScheduleIdByIndex = (index: number) => {
		setScheduleId(randomStrings[index]);
		setCount((prev) => prev + 1);
	};

	useEffect(() => {
		console.log('Updated Messages:', messages);
	}, [messages]);

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

	// const loadChatMessages = async (sid: string) => {
	// 	if (!sid) return;
	// 	try {
	// 		setIsLoading(true);
	// 		setError(null);

	// 		const data = await fetchChatMessages(sid);

	// 		if (data.Content?.chats) {
	// 			const loadedMessages: PromptWithActions[] = data.Content.chats.map(
	// 				(entry: any) => ({
	// 					id: entry.id,
	// 					origin: entry.origin,
	// 					content: entry.content,
	// 					actionId: entry.actionId,
	// 					requestId: entry.requestId,
	// 					sessionId: entry.sessionId,
	// 					actions:
	// 						entry.actions?.map((action: any) => ({
	// 							...action,
	// 							vibeRequest: {
	// 								...action.vibeRequest,
	// 								isClosed: action.vibeRequest?.isClosed ?? false,
	// 							},
	// 						})) ?? [], // 👈 ensure actions is always an array
	// 				})
	// 			);

	// 			// Sort oldest to newest by ID
	// 			loadedMessages.sort((a, b) => a.id.localeCompare(b.id));

	// 			// Merge with existing messages, avoiding duplicates
	// 			setMessages((prevMessages) => {
	// 				const existingIds = new Set(prevMessages.map((m) => m.id));
	// 				const uniqueNewMessages = loadedMessages.filter((m) => !existingIds.has(m.id));
	// 				return [...prevMessages, ...uniqueNewMessages];
	// 			});

	// 			console.log('Loaded Messages:', loadedMessages);
	// 		}
	// 	} catch (err) {
	// 		setError(err instanceof Error ? err.message : 'Failed to load chat messages');
	// 	} finally {
	// 		setIsLoading(false);
	// 	}
	// };

const loadChatMessages = async (sid: string) => {
	if (!sid) return;

	try {
		setIsLoading(true);
		setError(null);

		const data = await fetchChatMessages(sid);
		const rawMessages = data.Content?.chats as any[];
		if (!rawMessages) return;

		// Step 1: Collect all unique actionIds
		const uniqueActionIds = Array.from(
			new Set(
				rawMessages
					.flatMap((entry) => entry.actionIds || [])
					.filter(Boolean)
			)
		);

		// Step 2: Fetch and map actions by ID
		let allActionsMap: Record<string, Action> = {};
		if (uniqueActionIds.length > 0) {
			try {
				const fetchedActions = await fetchChatActions(uniqueActionIds);
				allActionsMap = fetchedActions.reduce((acc, action) => {
					acc[action.id] = {
						...action,
						vibeRequest: {
							...action.vibeRequest,
							isClosed: action.vibeRequest?.isClosed ?? false,
						},
					};
					return acc;
				}, {} as Record<string, Action>);
			} catch (err) {
				console.error('Error fetching actions:', err);
			}
		}

		// Step 3: Map messages with resolved actions
		const loadedMessages: PromptWithActions[] = rawMessages.map((entry) => {
			const actionIds: string[] = entry.actionIds ?? [];
			const resolvedActions = actionIds.map((id) => allActionsMap[id]).filter(Boolean);

			return {
				id: entry.id,
				origin: entry.origin,
				content: entry.content,
				actionId: entry.actionId,
				requestId: entry.requestId,
				sessionId: entry.sessionId,
				actionIds,
				actions: resolvedActions,
			};
		});

		// Step 4: Sort and merge with previous
		loadedMessages.sort((a, b) => a.id.localeCompare(b.id));

		setMessages((prevMessages) => {
			const existingIds = new Set(prevMessages.map((m) => m.id));
			const uniqueNewMessages = loadedMessages.filter((m) => !existingIds.has(m.id));
			return [...prevMessages, ...uniqueNewMessages];
		});

		console.log('Loaded Messages:', loadedMessages);
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

			const response = await sendChatMessage(message, entityId, sessionId);
			const promptMap = response?.Content?.vibeResponse?.prompts || {};
			console.log('Prompt Map:', promptMap);

			// Convert the prompt map to PromptWithActions[]
			const newMessages: PromptWithActions[] = Object.values(promptMap).map((entry: any) => ({
				id: entry.id,
				origin: entry.origin,
				content: entry.content,
				actionId: entry.actionId,
				requestId: entry.requestId,
				sessionId: entry.sessionId,
				actions: (entry.actions ?? []).map((action: any) => ({
					id: action.id,
					descriptions: action.descriptions,
					type: action.type,
					creationTimeInMs: action.creationTimeInMs,
					status: action.status,
					beforeScheduleId: action.beforeScheduleId,
					afterScheduleId: action.afterScheduleId,
					vibeRequest: {
						id: action.vibeRequest.id,
						creationTimeInMs: action.vibeRequest.creationTimeInMs,
						activeAction: action.vibeRequest.activeAction,
						isClosed: action.vibeRequest.isClosed ?? false,
						actions: action.vibeRequest.actions || [],
					},
				})),
			}));

			console.log('New Messages:', newMessages);

			// Append new messages to existing state
			setMessages((prev) => [...prev, ...newMessages]);
			console.log('Updated Messages');

			// Update session ID from the first prompt
			const sessionIdFromResponse = newMessages[0]?.sessionId;
			if (sessionIdFromResponse) {
				setSessionId(sessionIdFromResponse);
				setStoredSessionId(sessionIdFromResponse);
			}

			setMessage('');
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to send message');
		} finally {
			setIsSending(false);
			setError(null);
		}
	};

	const handleNewChat = () => {
		clearStoredSessionId();
		setSessionId('');
		setError(null);
		setMessage('');
		setMessages([]);
		console.log('New chat started, session cleared');
	};

	const removeChatContext = useAppStore((state) => state.removeChatContext); // Action to remove context

	const handleRemoveContext = (context: ChatContextType) => {
		removeChatContext(context); // Remove the clicked context
	};

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
				<Button
					variant="outline"
					style={{
						alignSelf: 'flex-end',
						marginBottom: '0.5rem',
						color: styles.colors.orange[500],
						borderColor: styles.colors.orange[500],
					}}
					onClick={handleNewChat}
				>
					Clear Session
				</Button>
				{chatContext.length === 0 ? (
					<ChatTitle>New Chat</ChatTitle>
				) : (
					<>
						{chatContext.map((context, index) => (
							<Button
								key={index}
								variant="outline"
								style={{
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'space-between',
									padding: '0.5rem',
									border: `1px solid ${styles.colors.gray[300]}`,
								}}
							>
								<span>{context.Name}</span>
								<span
									onClick={() => handleRemoveContext(context)}
									style={{
										marginLeft: '0.5rem',
										color: 'red',
										cursor: 'pointer',
									}}
								>
									x
								</span>
							</Button>
						))}
					</>
				)}
			</ChatHeader>
			<ChatContent>
				{isLoading && <div className="chat-loading">Loading chat messages...</div>}

				{error && <div className="chat-error">Error: {error}</div>}

				{!isLoading && !error && !messages.length && (
					<EmptyChat>
						<Logo size={48} />
						<h3>What would you like to do?</h3>
						<p>Describe a task, We&apos;ll handle the tiling.</p>
					</EmptyChat>
				)}

				<div className="messages-list">
					{messages.map((message) => (
						<MessageBubble key={message.id} $isUser={message.origin === 'user'}>
							<div className="message-content">{message.content}</div>
							{/* <div>{message.actions[0].descriptions}</div> */}

							{message.actions?.map((action) => (
								<Button
									key={action.id}
									variant="outline"
									style={{
										marginTop: '0.25rem',
										marginRight: '0.25rem',
										color: styles.colors.brand[500],
										borderColor: styles.colors.brand[500],
										fontSize: '0.875rem',
										padding: '0.25rem 0.5rem',
									}}
								>
									{action.descriptions}
								</Button>
							))}
						</MessageBubble>
					))}
				</div>

				<div ref={messagesEndRef} />
			</ChatContent>

			{/* Render chatContext buttons */}
			<div style={{ marginBottom: '0.25rem' }}></div>

			<Button
				variant="outline"
				style={{
					marginBottom: '0.5rem',
					color: styles.colors.brand[500],
					borderColor: styles.colors.brand[500],
				}}
				onClick={() => handleSetScheduleIdByIndex(count)}
			>
				Accept Changes
			</Button>

			<ChatForm onSubmit={handleSubmit}>
				<Input
					type="text"
					value={message}
					onChange={(e) => setMessage(e.target.value)}
					height={48}
					placeholder={t('home.expanded.chat.inputPlaceholder')}
					disabled={isSending}
					borderGradient={[styles.colors.brand[500]]}
				/>
				<ChatButton type="submit" disabled={isSending || !message.trim()}>
					<Plus size={20} />
				</ChatButton>
			</ChatForm>
		</ChatContainer>
	);
};

export default Chat;
