import React, { useEffect, useState, FormEvent, useRef, useCallback } from 'react';
import styled from 'styled-components';
import { ChevronLeftIcon, SendHorizontal, CircleStop } from 'lucide-react';
import Button from '@/core/common/components/button';
import Input from '../input';
import Logo from '@/core/common/components/icons/logo';
import { useTranslation } from 'react-i18next';
import {
	getStoredSessionId,
	setStoredSessionId,
	clearStoredSessionId,
} from '@/core/storage/chatSession';
import useAppStore, { ChatContextType } from '@/global_state';
import { PromptWithActions, VibeAction } from '@/core/common/types/chat';
import palette from '@/core/theme/palette';
import { chatService } from '@/services';
import ChatUtil from '@/core/util/chat';
import UserLocation from '@/core/common/components/chat/user_location';
import LoadingIndicator from '@/core/common/components/loading-indicator';
import { MarkdownRenderer } from '@/core/common/components/chat/MarkdownRenderer';
import { SignalRService } from '@/services/SocketService';

const ChatContainer = styled.section`
	display: flex;
	flex-direction: column;
	// gap: 1rem;
	height: 100%;
	padding: 1.5rem;

	@media screen and (min-width: ${palette.screens.lg}) {
		padding: 0;
	}
`;

const ChatHeader = styled.header`
	display: flex;
	justify-content: space-between;
	align-items: center;

	@media screen and (min-width: ${palette.screens.lg}) {
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
	border-radius: ${palette.borderRadius.xxLarge};
	background-color: ${palette.colors.white};
	color: ${palette.colors.brand[500]};
`;

const EmptyChat = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 0.5rem;
	height: 100%;

	h3 {
		font-size: ${palette.typography.fontSize.xl};
		font-weight: ${palette.typography.fontWeight.bold};
		color: ${palette.colors.white};
		font-family: ${palette.typography.fontFamily.urban};
		text-align: center;

		@media screen and (min-width: ${palette.screens.lg}) {
			h3 {
				font-size: ${palette.typography.fontSize.displayXs};
			}
		}
	}

	p {
		font-size: ${palette.typography.fontSize.sm};
		color: ${palette.colors.gray[500]};
		font-weight: ${palette.typography.fontWeight.medium};
		text-align: center;
	}
`;

const MessageBubble = styled.div<{ $isUser: boolean }>`
	display: flex;
	flex-direction: column;
	align-items: ${({ $isUser }) => ($isUser ? 'flex-end' : 'flex-start')};
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

const TypewriterStatus = styled.div`
	font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
	color: ${palette.colors.brand[400]};
	font-size: ${palette.typography.fontSize.sm};
	font-weight: ${palette.typography.fontWeight.medium};
	position: relative;
	z-index: 1;
	
	.cursor {
		animation: blink 1s infinite;
		color: ${palette.colors.brand[500]};
		font-weight: bold;
	}
	
	@keyframes blink {
		0%, 50% { opacity: 1; }
		51%, 100% { opacity: 0; }
	}
`;

const StatusContainer = styled.div<{ $isTyping?: boolean; $isVisible?: boolean }>`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	padding: ${({ $isVisible }) => $isVisible ? '0.75rem 1rem' : '0'};
	background: transparent;
	border-radius: ${palette.borderRadius.large};
	margin-bottom: ${({ $isVisible }) => $isVisible ? '0.5rem' : '0'};
	position: relative;
	overflow: hidden;
	max-height: ${({ $isVisible }) => $isVisible ? '80px' : '0'};
	opacity: ${({ $isVisible }) => $isVisible ? '1' : '0'};
	transform: translateY(${({ $isVisible }) => $isVisible ? '0' : '-10px'});
	transition: all 0.3s ease-in-out;
	
	${({ $isTyping }) => $isTyping && `
		&::before {
			content: '';
			position: absolute;
			top: 0;
			left: -100%;
			width: 100%;
			height: 100%;
			background: linear-gradient(
				90deg,
				transparent 0%,
				rgba(194, 15, 49, 0.05) 20%,
				rgba(194, 15, 49, 0.15) 50%,
				rgba(194, 15, 49, 0.05) 80%,
				transparent 100%
			);
			animation: shimmer 2.5s ease-in-out infinite;
			pointer-events: none;
		}
	`}
	
	.status-emoji {
		font-size: 1.2em;
		animation: pulse 2s ease-in-out infinite;
		z-index: 1;
		position: relative;
	}
	
	@keyframes pulse {
		0%, 100% { transform: scale(1); }
		50% { transform: scale(1.1); }
	}
	
	@keyframes shimmer {
		0% { 
			left: -100%; 
			opacity: 0;
		}
		50% {
			opacity: 1;
		}
		100% { 
			left: 100%; 
			opacity: 0;
		}
	}
`;

type ChatProps = {
	onClose?: () => void;
};

const Chat: React.FC<ChatProps> = ({ onClose }) => {
	const { t } = useTranslation();

	const chatContext = useAppStore((state) => state.chatContext); // Access chatContext
	const setGlobalScheduleId = useAppStore((state) => state.setGlobalScheduleId); // Action to set the schedule ID
	const triggerCalendarRefresh = useAppStore((state) => state.triggerCalendarRefresh); // Action to set the schedule ID
	const messagesEndRef = useRef<HTMLDivElement>(null);
	const messagesListRef = useRef<HTMLDivElement>(null);
	const [userMessage, setUserMessage] = useState('');
	const [messages, setMessages] = useState<PromptWithActions[]>([]);
	const [isSending, setIsSending] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [sessionId, setSessionId] = useState<string>('');
	const [isLoading, setIsLoading] = useState(false);
	const [isBatchLoading, setIsBatchLoading] = useState(false);
	const [requestId, setRequestId] = useState<string | null>(null);
	const entityId = chatContext.length > 0 ? chatContext[0].EntityId : ''; // Get EntityId from chatContext
	const scheduleId = useAppStore((state) => state.scheduleId);
	const anonymousUserId = useAppStore((state) => state.anonymousUser?.id ?? '');
	const userLongitude = useAppStore((state) => state.userInfo?.userLongitude ?? '');
	const userLatitude = useAppStore((state) => state.userInfo?.userLatitude ?? '');
	const userLocationVerified = useAppStore((state) => state.userInfo?.userLocationVerified ?? "false");
	const [socketService, setSocketService] = useState<SignalRService | null | undefined>(); // Replace 'username' with actual username if needed
	const [socketStatus, setSocketStatus] = useState<string>(''); // Current socket status message
	const [isProcessingSocket, setIsProcessingSocket] = useState(false); // Track if socket is processing
	const [displayedStatus, setDisplayedStatus] = useState<string>(''); // For typewriter effect
	const [isTyping, setIsTyping] = useState(false); // Track if typewriter is active
	const [isStatusVisible, setIsStatusVisible] = useState(false); // Track status visibility for smooth transitions
	const statusRotateIntervalRef = useRef<NodeJS.Timeout | null>(null);

	// Custom hook for typewriter effect - optimized to prevent unnecessary re-renders
	const useTypewriter = useCallback((text: string, speed: number = 50) => {
		useEffect(() => {
			if (!text) {
				setDisplayedStatus('');
				setIsTyping(false);
				return;
			}

			setIsTyping(true);
			setDisplayedStatus('');
			let currentIndex = 0;

			const typeInterval = setInterval(() => {
				if (currentIndex < text.length) {
					setDisplayedStatus(text.slice(0, currentIndex + 1));
					currentIndex++;
				} else {
					setIsTyping(false);
					clearInterval(typeInterval);
				}
			}, speed);

			return () => {
				clearInterval(typeInterval);
				setIsTyping(false);
			};
		}, [text, speed]);

		return { displayedText: displayedStatus, isTyping };
	}, [displayedStatus, isTyping]);

	// Extract emoji from status message - memoized to prevent recreation
	const extractEmoji = useCallback((message: string): string => {
		const emojiRegex = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u;
		const emojiMatch = message.match(emojiRegex);
		return emojiMatch ? emojiMatch[0] : '⚡';
	}, []);

	// Custom Status Display Component - memoized to prevent unnecessary re-renders
	const StatusDisplay = React.memo<{ message: string; showCursor?: boolean; isTyping?: boolean; isVisible?: boolean }>(
		(statusInfo: { message: string; showCursor?: boolean; isTyping?: boolean; isVisible?: boolean }) => {
			const { message, showCursor = false, isTyping = false, isVisible = true } = statusInfo;
		const emoji = extractEmoji(message);
		const emojiRegex = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u;
		const textWithoutEmoji = message.replace(emojiRegex, '').trim();
		
		return (
			<StatusContainer $isTyping={isTyping} $isVisible={isVisible}>
				{isVisible && (
					<>
						<span className="status-emoji">{emoji}</span>
						<TypewriterStatus>
							{textWithoutEmoji}
							{showCursor && <span className="cursor">|</span>}
						</TypewriterStatus>
					</>
				)}
			</StatusContainer>
		);
	});
	
	// Add display name for better debugging
	StatusDisplay.displayName = 'StatusDisplay';

	// Use the typewriter effect for socket status
	const { displayedText: typedStatus, isTyping: typewriterActive } = useTypewriter(socketStatus, 35);
	const handleSetScheduleId = (id: string) => {
		setGlobalScheduleId(id);
		triggerCalendarRefresh(); // Trigger calendar refresh after setting schedule ID
	};

	// Load session ID from local storage on mount
	useEffect(() => {
		const storedSessionId = getStoredSessionId();
		if (storedSessionId) {
			setSessionId(storedSessionId);
		}
	}, []);

	// Dynamic status messages with emojis and variations - memoized to prevent recreation
	const getStatusMessageVariations = useCallback((status: string, actionCount?: number): string[] => {
		const actionsText = actionCount ? ` (${actionCount} action${actionCount !== 1 ? 's' : ''})` : '';
		
		switch (status) {
			case 'action_initialization_start':
				return [
					`🚀 Initializing your request${actionsText}...`,
					`⚡ Setting up actions${actionsText}...`,
					`🔧 Preparing your schedule${actionsText}...`,
					`✨ Getting things ready${actionsText}...`,
					`🎯 Loading your preferences${actionsText}...`
				];
			case 'process_action_start':
				return [
					`🧠 Processing your request${actionsText}...`,
					`⚙️ Analyzing your schedule${actionsText}...`,
					`🔍 Finding optimal solutions${actionsText}...`,
					`💡 Working on your timeline${actionsText}...`,
					`📊 Crunching the data${actionsText}...`,
					`🎪 Making the magic happen${actionsText}...`
				];
			case 'summary_action_start':
				return [
					`📝 Generating your summary${actionsText}...`,
					`✍️ Crafting your response${actionsText}...`,
					`📋 Preparing final details${actionsText}...`,
					`🎨 Polishing everything up${actionsText}...`,
					`📄 Compiling your results${actionsText}...`
				];
			case 'summary_action_end':
				return [
					`🎉 Almost there${actionsText}!`,
					`✅ Finalizing everything${actionsText}...`,
					`🏁 Wrapping things up${actionsText}...`,
					`💫 Putting finishing touches${actionsText}...`,
					`🎊 Getting ready to show you${actionsText}!`
				];
			case 'schedule_load':
				return [
					`📅 Loading your schedule${actionsText}...`,
					`🗓️ Fetching calendar data${actionsText}...`,
					`📊 Retrieving your timeline${actionsText}...`,
					`⏰ Gathering schedule information${actionsText}...`,
					`📋 Loading your agenda${actionsText}...`
				];
			case 'schedule_process_start':
				return [
					`⚙️ Processing schedule changes${actionsText}...`,
					`🔄 Updating your calendar${actionsText}...`,
					`📝 Applying modifications${actionsText}...`,
					`🎯 Optimizing your schedule${actionsText}...`,
					`🔧 Making schedule adjustments${actionsText}...`
				];
			case 'schedule_process_end':
				return [
					`✅ Schedule processing complete${actionsText}!`,
					`🎉 Your calendar is updated${actionsText}!`,
					`✨ Schedule changes applied${actionsText}!`,
					`🏁 Schedule optimization finished${actionsText}!`,
					`💫 Your timeline is ready${actionsText}!`
				];
			default:
				return [
					`⏳ Processing${actionsText}...`,
					`🔄 Working on it${actionsText}...`,
					`💭 Thinking${actionsText}...`
				];
		}
	}, []);

	// Function to get a random status message - memoized to prevent recreation
	const getStatusMessage = useCallback((status: string, actionCount?: number): string => {
		const variations = getStatusMessageVariations(status, actionCount);
		return variations[Math.floor(Math.random() * variations.length)];
	}, [getStatusMessageVariations]);

	// Function to process socket messages and update status - optimized to reduce re-renders
	const processSocketMessage = useCallback((data: unknown) => {
		const socketData = data as {
			data?: {
				vibe?: {
					status?: string;
					sessionId?: string;
					actionCount?: number;
				};
			};
			requestId?: string | null;
		};

		if (socketData?.data?.vibe?.status 
			// && socketData?.data?.vibe?.sessionId === sessionId
		) {
			const status = socketData.data.vibe.status;
			const actionCount = socketData.data.vibe.actionCount;
			
			// Show status container as soon as we start processing
			React.startTransition(() => {
				const newMessage = getStatusMessage(status, actionCount);
				setSocketStatus(newMessage);
				setIsProcessingSocket(true);
				setIsStatusVisible(true); // Always show when we have socket activity
			});

			// Clear any existing rotation interval first
			if (statusRotateIntervalRef.current) {
				clearInterval(statusRotateIntervalRef.current);
				statusRotateIntervalRef.current = null;
			}

			// For longer processes, rotate messages to keep it engaging
			if (status === 'process_action_start') {
				let messageIndex = 0;
				const variations = getStatusMessageVariations(status, actionCount);
				
				const rotateInterval = setInterval(() => {
					messageIndex = (messageIndex + 1) % variations.length;
					// Don't hide the status during rotation, just update the message
					React.startTransition(() => {
						setSocketStatus(variations[messageIndex]);
					});
				}, 3000); // Change message every 3 seconds

				statusRotateIntervalRef.current = rotateInterval;
			}

			// Only hide status container after summary_action_end (final step)
			if (status === 'summary_action_end' || status === 'schedule_process_end') {
				setTimeout(() => {
					React.startTransition(() => {
						setIsStatusVisible(false); // Start fade out transition
					});
					// Clear the status text and processing state after transition completes
					setTimeout(() => {
						React.startTransition(() => {
							setSocketStatus('');
							setIsProcessingSocket(false);
						});
					}, 300); // Match transition duration
					// Clear rotation interval if it exists
					if (statusRotateIntervalRef.current) {
						clearInterval(statusRotateIntervalRef.current);
						statusRotateIntervalRef.current = null;
					}
				}, 1500); // Slightly longer delay to show completion message
			}
		}
	}, [sessionId, getStatusMessage, getStatusMessageVariations]);

	// Load chat messages when session ID changes
	useEffect(() => {
		if (sessionId) {
			loadChatMessages(sessionId);
		}
	}, [sessionId, scheduleId]);

	useEffect(() => {
		if (anonymousUserId) {
			console.log('Setting up SignalR connection for chatComponent for user:', anonymousUserId);
			setSocketService(new SignalRService(anonymousUserId));
		} else {
			socketService?.dispose();
			setSocketService(null);
		}
	}, [anonymousUserId]);

	useEffect(() => {
		if (!socketService) return;
		
		console.log('Initializing SignalR connection for chatComponent');
		socketService.createVibeConnection();
		socketService.subscribeToSocketDataReceipt((data) => {
			if (!data) return;
			console.log('Received data for chatComponent:', data);
			processSocketMessage(data); // Process the socket message for status updates
		});
		
		// Cleanup function
		return () => {
			if (statusRotateIntervalRef.current) {
				clearInterval(statusRotateIntervalRef.current);
				statusRotateIntervalRef.current = null;
			}
		};
	}, [socketService]); // Removed processSocketMessage from dependencies to prevent unnecessary re-renders

	// Custom hook to check unexecuted actions - optimized to reduce API calls
	const useHasUnexecutedActions = (requestId: string | null) => {
		const [hasUnexecuted, setHasUnexecuted] = useState(false);
		const lastCheckedRequestId = useRef<string | null>(null);
		
		useEffect(() => {
			// Skip if we already checked this requestId
			if (!requestId || requestId === lastCheckedRequestId.current) {
				if (!requestId) {
					setHasUnexecuted(false);
				}
				return;
			}
			
			lastCheckedRequestId.current = requestId;
			
			const checkActions = async () => {
				try {
					const response = await chatService.getVibeRequest(requestId);
					const isClosed = response?.Content?.vibeRequest?.isClosed;
					setHasUnexecuted(isClosed !== true);
				} catch (error) {
					console.error('Error checking vibe request status:', error);
					// Fallback to original logic if API fails
					const fallback = messages.some((msg) =>
						msg.actions?.some(
							(action) => action.status !== 'executed' && action.status !== 'exited'
						)
					);
					setHasUnexecuted(fallback);
				}
			};
			
			checkActions();
		}, [requestId]); // Removed messages dependency to prevent excessive API calls
		
		return hasUnexecuted;
	};

	const shouldShowAcceptButton = useHasUnexecutedActions(requestId);

	useEffect(() => {
		if (messages.length > 0 && messagesListRef.current) {
			messagesListRef.current.scrollTo({
			top: messagesListRef.current.scrollHeight,
			behavior: "smooth",
			});
		}
	}, [messages]);


	// Helper function to update messages with actions progressively
	const updateMessagesWithActions = (rawMessages: PromptWithActions[], actionsMap: Record<string, VibeAction>) => {
		const updatedMessages: PromptWithActions[] = rawMessages.map((entry) => {
			const actionIds: string[] = entry.actionIds ?? [];
			const resolvedActions = actionIds.map((id) => actionsMap[id]).filter(Boolean);

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

		// Sort by timestamp
		updatedMessages.sort((a, b) => {
			const extractTimestamp = (id: string): number => {
				const match = id.match(/(\d{18})/);
				return match ? parseInt(match[1], 10) : 0;
			};
			return extractTimestamp(a.id) - extractTimestamp(b.id);
		});

		// Update state with partial results
		setMessages((prevMessages) => {
			const existingIds = new Set(prevMessages.map((m) => m.id));
			const uniqueNewMessages = updatedMessages.filter((m) => !existingIds.has(m.id));

			const mergedMessages = prevMessages.map((prevMessage) => {
				const updatedMessage = updatedMessages.find((m) => m.id === prevMessage.id);
				return updatedMessage || prevMessage;
			});

			return [...mergedMessages, ...uniqueNewMessages];
		});
	};

	const loadChatMessages = async (sid: string) => {
		if (!sid) return;

		try {
			setIsLoading(true);
			setError(null);

			const data = await chatService.getMessages(sid);
			const rawMessages = data.Content.chats || [];
			if (!rawMessages || rawMessages.length === 0) return;

			// Collect all unique actionIds, ordered by message timestamp (newest first)
			const messagesByTimestamp = rawMessages
				.map((entry) => ({
					...entry,
					timestamp: (() => {
						const match = entry.id.match(/(\d{18})/);
						return match ? parseInt(match[1], 10) : 0;
					})()
				}))
				.sort((a, b) => b.timestamp - a.timestamp); // Sort newest first

			const uniqueActionIds = Array.from(
				new Set(messagesByTimestamp.flatMap((entry) => entry.actionIds || []).filter(Boolean))
			);

			// Fetch and map actions by ID with batching
			let allActionsMap: Record<string, VibeAction> = {};
			if (uniqueActionIds.length > 0) {
				const BATCH_SIZE = 10;
				const shouldBatch = uniqueActionIds.length > BATCH_SIZE;

				if (shouldBatch) {
					setIsBatchLoading(true);
					
					// Create batches (most recent actions first)
					const batches: string[][] = [];
					for (let i = 0; i < uniqueActionIds.length; i += BATCH_SIZE) {
						batches.push(uniqueActionIds.slice(i, i + BATCH_SIZE));
					}

					// Process batches sequentially, updating UI after each batch
					for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
						const batch = batches[batchIndex];
						const isLastBatch = batchIndex === batches.length - 1;

						try {
							const fetchedActions = await chatService.getActions(batch);
							const batchActionsMap = fetchedActions.reduce(
								(acc, action) => {
									acc[action.id] = action;
									return acc;
								},
								{} as Record<string, VibeAction>
							);

							// Merge with existing actions
							allActionsMap = { ...allActionsMap, ...batchActionsMap };

							// Update messages with current actions if not the last batch
							if (!isLastBatch) {
								updateMessagesWithActions(rawMessages, allActionsMap);
							}
						} catch (error) {
							console.error(`Error fetching batch ${batchIndex + 1}:`, error);
						}
					}
					
					setIsBatchLoading(false);
				} else {
					// Single request for small number of actions
					const fetchedActions = await chatService.getActions(uniqueActionIds);
					allActionsMap = fetchedActions.reduce(
						(acc, action) => {
							acc[action.id] = action;
							return acc;
						},
						{} as Record<string, VibeAction>
					);
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

			// Sort by timestamp extracted from ID (chronological order)
			loadedMessages.sort((a, b) => {
				const extractTimestamp = (id: string): number => {
					const match = id.match(/(\d{18})/); // Extract 18-digit timestamp
					return match ? parseInt(match[1], 10) : 0;
				};
				return extractTimestamp(a.id) - extractTimestamp(b.id);
			});
			
			setMessages((prevMessages) => {
				const existingIds = new Set(prevMessages.map((m) => m.id));
				const uniqueNewMessages = loadedMessages.filter((m) => !existingIds.has(m.id));

				// Merge actions for existing messages
				const updatedMessages = prevMessages.map((prevMessage) => {
					const updatedMessage = loadedMessages.find((m) => m.id === prevMessage.id);
					return updatedMessage || prevMessage;
				});

				return [...updatedMessages, ...uniqueNewMessages];
			});
			let latestRequestId:string = '';

			loadedMessages.forEach((eachMsg) => {
				if(eachMsg.requestId && (eachMsg.requestId > latestRequestId))
				{latestRequestId = eachMsg.requestId;}
			});

			setRequestId(latestRequestId);
		} catch (err) {
			if (err instanceof Error) setError(err.message);
			else setError('Failed to load chat messages');
		} finally {
			setIsLoading(false);
		}
	};

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault();
		if (!userMessage.trim() || isSending) return;

		try {
			setIsSending(true);
			setError(null);

			const response = await chatService.sendMessage(
				userMessage,
				entityId,
				sessionId,
				anonymousUserId,
				userLongitude,
				userLatitude,
				userLocationVerified,
			);
			if (
				response?.Content?.vibeResponse?.tilerUser &&
				JSON.stringify(response.Content.vibeResponse.tilerUser) !==
					JSON.stringify(useAppStore.getState().userInfo)
			) {
				useAppStore.getState().setUserInfo(response.Content.vibeResponse.tilerUser);
			}
			const promptMap = response?.Content?.vibeResponse?.prompts || {};

			// Convert the prompt map to PromptWithActions[]
			const newMessages: PromptWithActions[] = Object.values(promptMap).map(
				(entry: PromptWithActions) => ({
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
				})
			);
			let updatedRequestId: string = '';
			const updatedMessageData = await chatService.getMessages(sessionId);
			// const newPrompts:Array<PromptWithActions> = []
			const otherPromptDict = new Map<string, PromptWithActions>();
			updatedMessageData.Content.chats.concat(newMessages).forEach((chatEntry) => {
				const existingMessage = messages.find((msg) => msg.id === chatEntry.id);
				if (existingMessage) {
					// Update existing message with new data
					Object.assign(existingMessage, chatEntry);
				} else {
					otherPromptDict.set(chatEntry.id, chatEntry);
				}
				if (chatEntry.requestId && (chatEntry.requestId > updatedRequestId)) {
					updatedRequestId = chatEntry.requestId;
				}
			});

			// Append new messages to existing state
			setMessages((prev) => [...prev, ...otherPromptDict.values()]);
			setRequestId(updatedRequestId);

			// Update session ID from the first prompt
			const sessionIdFromResponse = newMessages[0]?.sessionId;
			if (sessionIdFromResponse) {
				setSessionId(sessionIdFromResponse);
				setStoredSessionId(sessionIdFromResponse);
			}

			setUserMessage('');
		} catch (err) {
			if (err instanceof Error) setError(err.message);
			else setError('Failed to send message');
		} finally {
			setIsSending(false);
		}
	};

	const acceptAllChanges = async () => {
		try {
			setIsSending(true);
			setError(null);
			const executedChanges = await chatService.sendChatAcceptChanges(
				requestId,
				anonymousUserId,
				userLongitude,
				userLatitude,
				userLocationVerified
			);
			const newScheduleId = executedChanges?.Content?.vibeRequest?.afterScheduleId || null;
			if (newScheduleId) {
				handleSetScheduleId(newScheduleId);
				// useEffect will automatically reload messages when scheduleId changes
			}
		} catch (err) {
			if (err instanceof Error) setError(err.message);
			else setError('Failed to accept changes');
		} finally {
			setIsSending(false);
		}
	};


	const handleNewChat = () => {
		clearStoredSessionId();
		setSessionId('');
		setError(null);
		setUserMessage('');
		setMessages([]);
		setRequestId(null);
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
							color: palette.colors.orange[500],
							borderColor: palette.colors.orange[500],
						}}
						onClick={handleNewChat}
					>
						{t('home.expanded.chat.clearSession')}
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
									border: `1px solid ${palette.colors.gray[300]}`,
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
				{isLoading && <LoadingIndicator message={t('home.expanded.chat.loadingMessages')} />}
				{isBatchLoading && <LoadingIndicator message={t('home.expanded.chat.loadingActions')} />}

				{error && <div className="chat-error">{t('home.expanded.chat.error')}: {error}</div>}

				{!isLoading && !error && !messages.length && (
					<EmptyChat>
						<Logo size={48} />
						<h3>{t('home.expanded.chat.emptyStateTitle')}</h3>
						<p>{t('home.expanded.chat.emptyStateDescription')}</p>
					</EmptyChat>
				)}

				<div className="messages-list" ref={messagesListRef}>
					{messages.map((eachPromptMsg:PromptWithActions) => (
						<MessageBubble key={eachPromptMsg.id} $isUser={eachPromptMsg.origin === 'user'}>
							<div className="message-content">
								<MarkdownRenderer content={eachPromptMsg.content} />
							</div>

							{eachPromptMsg.actions?.filter(action => action.type !== 'conversational_and_not_supported').map((action) => (
								<Button
									key={action.id}
									variant="pill"
									dotstatus={
										action.status as
											| 'parsed'
											| 'clarification'
											| 'none'
											| 'pending'
											| 'executed'
											| 'failed'
											| 'exited'
											| undefined
									}
								>
									<img
										src={ChatUtil.getActionIcon(action)}
										alt="action_icon"
										style={{
											width: '15px',
											height: '15px',
											verticalAlign: 'middle',
										}}
									/>
									<span style={{ marginLeft: '4px', marginRight: '4px' }}>-</span>
									<span className="action-description">{action.descriptions}</span>
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
				{isSending && !isProcessingSocket && (
					<LoadingIndicator message={t('home.expanded.chat.sendingRequest')} />
				)}
				{/* Always render StatusDisplay to prevent DOM removal/addition jumps */}
				<StatusDisplay 
					message={typedStatus || ''} 
					showCursor={typewriterActive} 
					isTyping={typewriterActive}
					isVisible={isStatusVisible}
				/>
				{!isSending && shouldShowAcceptButton && (
					<Button
						variant="primary"
						onClick={() => acceptAllChanges()}
					>
						{t('home.expanded.chat.acceptChanges')}
					</Button>
				)}
			</div>

			<ChatForm onSubmit={handleSubmit}>
				<Input.Textarea
					value={userMessage}
					onChange={(e) => setUserMessage(e.target.value)}
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
					bordergradient={[palette.colors.brand[500]]}
					height={50} // Set a fixed height for consistent alignment
				/>
				<ChatButton type="submit" disabled={isSending || !userMessage.trim()}>
					{isSending ? <CircleStop size={20} /> : <SendHorizontal size={20} />}
				</ChatButton>
			</ChatForm>
			<UserLocation />
		</ChatContainer>
	);
};

export default Chat;
