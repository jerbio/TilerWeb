import React, { useEffect, useState, FormEvent, useRef } from 'react';
import styled from 'styled-components';
import styles from '../../../util/styles';
import Button from '../button';
import { ChevronLeftIcon, SendHorizontal, CircleStop } from 'lucide-react';
import Input from '../input';
import Logo from '../../icons/logo';
import { useTranslation } from 'react-i18next';
import {
	fetchChatMessages,
	fetchChatActions,
	sendChatMessage,
	getStoredSessionId,
	setStoredSessionId,
	clearStoredSessionId,
	sendChatAcceptChanges,
	getActionIcon,
} from './util/chat_service';
import useAppStore from '../../../global_state'; // Import Zustand Global State
import { ChatContextType } from '../../../global_state'; // Import ChatContextType
import { PromptWithActions, VibeAction } from './util/chat'; // Import types
import HORIZONTALPROGRESSBAR from '../../../assets/image_assets/horizontal_progress_bar.gif';

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
	width: 100%; /* Ensure the form stretches fully */
	display: flex;
	align-items: center;
	gap: 0.5rem; /* Optional: Add spacing between elements */
	margin-top: 8px; /* Add some space above the form */
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

const Chat: React.FC = ({ onClose }: ChatProps) => {
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
	const [requestId, setRequestId] = useState<string | null>(null);
	const entityId = chatContext.length > 0 ? chatContext[0].EntityId : ''; // Get EntityId from chatContext

	const scheduleId = useAppStore((state) => state.scheduleId);
	const anonymousUserId = useAppStore((state) => state.userInfo?.id ?? '');
	const handleSetScheduleId = (id: string) => {
		setScheduleId(id);
	};

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
	}, [sessionId, scheduleId]);

	const loadChatMessages = async (sid: string) => {
		if (!sid) return;

		try {
			setIsLoading(true);
			setError(null);

			const data = await fetchChatMessages(sid);
			const rawMessages = data.Content?.chats as PromptWithActions[];
			if (!rawMessages) return;

			// Collect all unique actionIds
			const uniqueActionIds = Array.from(
				new Set(rawMessages.flatMap((entry) => entry.actionIds || []).filter(Boolean))
			);

			// Fetch and map actions by ID
			let allActionsMap: Record<string, VibeAction> = {};
			if (uniqueActionIds.length > 0) {
				try {
					const fetchedActions = await fetchChatActions(uniqueActionIds);
					allActionsMap = fetchedActions.reduce(
						(acc, action) => {
							acc[action.id] = action;
							return acc;
						},
						{} as Record<string, VibeAction>
					);
				} catch (err) {
					console.error('Error fetching actions:', err);
				}
			}

			// Map messages with resolved actions
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

			// Sort and merge with previous
			loadedMessages.sort((a, b) => a.id.localeCompare(b.id));

			setMessages((prevMessages) => {
				const existingIds = new Set(prevMessages.map((m) => m.id));
				const uniqueNewMessages = loadedMessages.filter((m) => !existingIds.has(m.id));

				// Merge actions for existing messages
				const updatedMessages = prevMessages.map((prevMessage) => {
					const updatedMessage = loadedMessages.find((m) => m.id === prevMessage.id);
					return updatedMessage
						? { ...prevMessage, actions: updatedMessage.actions }
						: prevMessage;
				});

				return [...updatedMessages, ...uniqueNewMessages];
			});
			setRequestId(loadedMessages[0]?.requestId || null);
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

			const response = await sendChatMessage(message, entityId, sessionId, anonymousUserId);
			if (
				response?.Content?.vibeResponse?.tilerUser &&
				JSON.stringify(response.Content.vibeResponse.tilerUser) !==
					JSON.stringify(useAppStore.getState().userInfo)
			) {
				useAppStore.getState().setUserInfo?.(response.Content.vibeResponse.tilerUser);
			}
			const promptMap = response?.Content?.vibeResponse?.prompts || {};

			// Convert the prompt map to PromptWithActions[]
			const newMessages: PromptWithActions[] = Object.values(promptMap).map((entry: PromptWithActions) => ({
				id: entry.id,
				origin: entry.origin,
				content: entry.content,
				actionId: entry.actionId,
				requestId: entry.requestId,
				sessionId: entry.sessionId,
				actions: (entry.actions ?? []).map((action: VibeAction) => ({
					id: action.id,
					descriptions: action.descriptions,
					type: action.type,
					creationTimeInMs: action.creationTimeInMs,
					status: action.status,
					beforeScheduleId: action.beforeScheduleId,
					afterScheduleId: action.afterScheduleId,
					prompts: action.prompts ?? [],
					vibeRequest: {
						id: action.vibeRequest.id,
						creationTimeInMs: action.vibeRequest.creationTimeInMs,
						activeAction: action.vibeRequest.activeAction,
						isClosed: action.vibeRequest.isClosed ?? false,
						beforeScheduleId: action.vibeRequest.beforeScheduleId || null,
						afterScheduleId: action.vibeRequest.afterScheduleId || null,
						actions: action.vibeRequest.actions || [],
					},
				})),
			}));

			// Append new messages to existing state
			setMessages((prev) => [...prev, ...newMessages]);
			setRequestId(newMessages[0]?.requestId || null);

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

	const acceptAllChanges = async () => {
		try {
			setIsSending(true);
			setError(null);

			const executedChanges = await sendChatAcceptChanges(requestId);

			const newScheduleId = executedChanges?.Content?.vibeRequest?.afterScheduleId || null;
			if (newScheduleId) {
				handleSetScheduleId(newScheduleId);

				// Trigger reloading of chat messages
				if (sessionId) {
					await loadChatMessages(sessionId);
				}
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to accept changes');
		} finally {
			setIsSending(false);
		}
	};

	const hasUnexecutedActions = () => {
		return messages.some((msg) => msg.actions?.some((action) => action.status !== 'executed'));
	};

	const handleNewChat = () => {
		clearStoredSessionId();
		setSessionId('');
		setError(null);
		setMessage('');
		setMessages([]);
		handleSetScheduleId('');
	};

	const removeChatContext = useAppStore((state) => state.removeChatContext); // Action to remove context

	const handleRemoveContext = (context: ChatContextType) => {
		removeChatContext(context); // Remove the clicked context
	};

	return (
		<ChatContainer>
			<ChatHeader>
				{onClose && (
					<Button variant="ghost" height={32} onClick={onClose}>
						<ChevronLeftIcon size={16} />
						<span>{t('common.buttons.back')}</span>
					</Button>
				)}
				{import.meta.env.VITE_NODE_ENV === 'development' && (
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
				)}
				{chatContext.length === 0 ? (
					<Button variant="ghost" height={32} onClick={handleNewChat}>
						<span>{t('home.expanded.chat.newChat')}</span>
					</Button>
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

							{message.actions?.map((action) => (
								<Button
									key={action.id}
									variant="pill"
									dotstatus={
										action.status as
											| 'parsed'
											| 'clarification'
											| 'executed'
											| undefined
									}
								>
									<img
										src={getActionIcon(action)}
										alt="add_new_appointment"
										style={{
											width: '15px',
											height: '15px',
											verticalAlign: 'middle',
										}}
									/>{' '}
									- {action.descriptions}
								</Button>
							))}
						</MessageBubble>
					))}
				</div>

				<div ref={messagesEndRef} />
			</ChatContent>

			{/* Render chatContext buttons */}
			<div style={{ marginBottom: '0.25rem' }}></div>

			<div>
				{isSending && (
					<div
						style={{
							marginBottom: '0.5rem',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
						}}
					>
						{/* <span
							className="spinner"
							style={{
								width: '24px',
								height: '24px',
								border: '4px solid #f3f3f3',
								borderTop: `4px solid ${styles.colors.brand[500]}`,
								borderRadius: '50%',
								animation: 'spin 1s linear infinite',
								marginRight: '0.5rem',
							}}
						/>
						<style>
							{`
									@keyframes spin {
										0% { transform: rotate(0deg); }
										100% { transform: rotate(360deg); }
									}
								`}
						</style> */}
						<img src={HORIZONTALPROGRESSBAR} alt="Loading..." style={{ width: '24px', height: '24px', marginRight: '0.5rem' }} />
						<span>Sending Request...</span>
					</div>
				)}
				{!isSending && hasUnexecutedActions() && (
					<Button
						variant="outline"
						style={{
							marginBottom: '0.5rem',
							color: styles.colors.brand[500],
							borderColor: styles.colors.brand[500],
						}}
						onClick={() => acceptAllChanges()}
					>
						Accept Changes
					</Button>
				)}
			</div>

			<ChatForm onSubmit={handleSubmit}>
				<Input
					other="textarea"
					value={message}
					onChange={(e) => setMessage(e.target.value)}
					onKeyDown={(e) => {
						// Submit form on Enter key press without Shift key
						if (e.key === 'Enter' && !e.shiftKey) {
							e.preventDefault(); // Prevent new line

							// Use form.requestSubmit() instead of handleSubmit directly
							// This triggers a single form submission through the standard form mechanism
							const form = e.currentTarget.form;
							if (form) form.requestSubmit();
						}
					}}
					placeholder={t('home.expanded.chat.inputPlaceholder')}
					disabled={isSending}
					borderGradient={[styles.colors.brand[500]]}
					height={50} // Set a fixed height for consistent alignment
				/>
				<ChatButton type="submit" disabled={isSending || !message.trim()}>
					{isSending ? <CircleStop size={20} /> : <SendHorizontal size={20} />}
				</ChatButton>
			</ChatForm>
		</ChatContainer>
	);
};

export default Chat;
