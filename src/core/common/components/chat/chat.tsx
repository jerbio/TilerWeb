import React, { useEffect, useState, FormEvent, useRef } from 'react';
import styled from 'styled-components';
import { ChevronLeftIcon, SendHorizontal, CircleStop } from 'lucide-react';
import Button from '@/core/common/components/button';
import Input from '../input';
import Logo from '@/core/common/components/icons/logo';
import { useTranslation } from 'react-i18next';
import useAppStore, { ChatContextType } from '@/global_state';
import { PromptWithActions, VibeAction } from '@/core/common/types/chat';
import palette from '@/core/theme/palette';
import { Status } from '@/core/constants/enums';
import { chatService } from '@/services';
import ChatUtil from '@/core/util/chat';
import UserLocation from '@/core/common/components/chat/user_location';
import LoadingIndicator from '@/core/common/components/loading-indicator';
import { MarkdownRenderer } from '@/core/common/components/chat/MarkdownRenderer';
import { personaService, personaUserService } from '@/services';
import { locationService } from '@/services/locationService';
import { SignalRService } from '@/services/SocketService';
import { ChatLimitError } from '@/core/common/types/errors';
import ErrorPopup from '@/core/common/components/error-popup/ErrorPopup';

// Custom hook to check unexecuted actions
const useHasUnexecutedActions = (requestId: string | null, messages: PromptWithActions[]) => {
  const [hasUnexecuted, setHasUnexecuted] = useState(false);

  useEffect(() => {
    const checkActions = async () => {
      if (!requestId) {
        setHasUnexecuted(false);
        return;
      }

      try {
        const response = await chatService.getVibeRequest(requestId);
        const isClosed = response?.Content?.vibeRequest?.isClosed;
        setHasUnexecuted(isClosed !== true);
      } catch (error) {
        console.error('Error checking vibe request status:', error);
        // Fallback to original logic if API fails
        const fallback = messages.some((msg) =>
          msg.actions?.some(
            (action) => action.status !== Status.Executed && action.status !== Status.Exited
          )
        );
        setHasUnexecuted(fallback);
      }
    };

    checkActions();
  }, [requestId, messages]); // Re-check when requestId or messages change

  return hasUnexecuted;
};

const ChatWrapper = styled.section`
	height: 100%;
	position: relative;
`;

const ChatContainer = styled.section`
	position: absolute;
	inset: 0;
	height: 100%;
	display: flex;
	flex-direction: column;
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

type ChatProps = {
  onClose?: () => void;
};

const Chat: React.FC<ChatProps> = ({ onClose }) => {
  const { t } = useTranslation();

  const chatContext = useAppStore((state) => state.chatContext); // Access chatContext
  const setScheduleId = useAppStore((state) => state.setScheduleId); // Action to set the schedule ID
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesListRef = useRef<HTMLDivElement>(null);
  const webSocketCommunication = useRef<SignalRService | null>(null);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<PromptWithActions[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isBatchLoading, setIsBatchLoading] = useState(false);
  const [requestId, setRequestId] = useState<string | null>(null);
  const [webSocketStatus, setWebSocketStatus] = useState<string | null>(null);
  const [showErrorPopup, setShowErrorPopup] = useState(false);
  const [errorPopupMessage, setErrorPopupMessage] = useState('');
  const entityId = chatContext.length > 0 ? chatContext[0].EntityId : ''; // Get EntityId from chatContext

  const scheduleId = useAppStore((state) => state.scheduleId);
  const selectedPersonaId = useAppStore((state) => state.selectedPersonaId);
  const userInfo = useAppStore((state) => state.userInfo);
  const setUserInfo = useAppStore((state) => state.setUserInfo);
  const anonymousUserId = userInfo?.id ?? '';
  const handleSetScheduleId = (id: string) => {
    setScheduleId(id);
  };

  // Sync userInfo.id when selectedPersonaId changes
  useEffect(() => {
    const syncUserIdFromPersona = async () => {
      if (selectedPersonaId !== null) {
        try {
          let personaInfo = await personaUserService.getSelectedPersonaInfo(selectedPersonaId);

          // If no user exists for this persona, create anonymous user immediately
          if (!personaInfo) {
            const selectedPersona = await personaUserService.getPersonaByIndex(selectedPersonaId);
            if (selectedPersona) {
              console.log('Creating anonymous user for selected persona:', selectedPersona.name);
              const personaUser = await personaService.createAnonymousUser(selectedPersona);

              const userId = personaUser.anonymousUser.id;
              if (!userId) {
                console.error('Failed to create anonymous user: userId is null');
                return;
              }

              // Store the new user in localStorage
              personaUserService.setPersonaUser(selectedPersona.id, {
                userId: userId,
                personaInfo: { name: selectedPersona.name },
              });

              // Update personaInfo with the new user data
              personaInfo = {
                userId: userId,
                expiration: Date.now() + (24 * 60 * 60 * 1000), // 1 day
                personaInfo: { name: selectedPersona.name }
              };
            }
          }

          if (personaInfo?.userId) {
            const currentUserInfo = useAppStore.getState().userInfo;
            // Only update if the ID is actually different to prevent loops
            if (currentUserInfo?.id !== personaInfo.userId) {
              if (currentUserInfo) {
                setUserInfo({ ...currentUserInfo, id: personaInfo.userId });
              } else {
                // Create minimal userInfo if it doesn't exist
                setUserInfo({
                  id: personaInfo.userId,
                  username: 'Anonymous',
                  timeZoneDifference: 0,
                  timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                  email: null,
                  endfOfDay: '0001-01-01T00:00:00+00:00',
                  phoneNumber: null,
                  fullName: '',
                  firstName: '',
                  lastName: '',
                  countryCode: '1',
                });
              }
            }
          }
        } catch (error) {
          console.warn('Failed to sync user ID from persona:', error);
        }
      }
    };

    syncUserIdFromPersona();
  }, [selectedPersonaId, setUserInfo]);

  // Format WebSocket status for display
  const formatWebSocketStatus = (status: string): string => {
    const statusMap: Record<string, string[]> = {
      'action_initialization_start': [
        'Initializing action generation...',
        'Setting things up...',
        'Preparing your request...',
        'Getting ready...',
      ],
      'process_action_start': [
        'Processing action...',
        'Working on it...',
        'Analyzing your request...',
        'Thinking...',
      ],
      'process_action_end': [
        'Action processing complete',
        'Processing done!',
        'All set!',
        'Finished processing',
      ],
      'summary_action_start': [
        'Generating summary...',
        'Summarizing results...',
        'Creating overview...',
        'Preparing summary...',
      ],
      'summary_action_end': [
        'Summary generation complete',
        'Summary ready!',
        'Overview complete',
        'Done summarizing',
      ],
      'schedule_load': [
        'Loading schedule data...',
        'Fetching your schedule...',
        'Retrieving calendar...',
        'Loading timeline...',
      ],
      'schedule_process_start': [
        'Optimizing schedule...',
        'Reorganizing your day...',
        'Finding the best fit...',
        'Adjusting timeline...',
      ],
      'schedule_process_end': [
        'Schedule optimization complete',
        'Schedule updated!',
        'Timeline optimized',
        'All done!',
      ],
    };

    const messages = statusMap[status];
    if (messages && messages.length > 0) {
      const randomIndex = Math.floor(Math.random() * messages.length);
      return messages[randomIndex];
    }

    // Fallback for unmapped statuses
    return status.replace(/_/g, ' ').toLowerCase();
  };

  useEffect(() => {
    if (!anonymousUserId) return;

    webSocketCommunication.current = new SignalRService(anonymousUserId);
    webSocketCommunication.current.createVibeConnection();
    webSocketCommunication.current.subscribeToSocketDataReceipt((data: unknown) => {
      console.log('WebSocket data received in chat component:', data);

      // Type guard and extract vibe data from WebSocket
      if (
        data &&
        typeof data === 'object' &&
        'data' in data &&
        data.data &&
        typeof data.data === 'object' &&
        'vibe' in data.data &&
        data.data.vibe &&
        typeof data.data.vibe === 'object' &&
        'status' in data.data.vibe &&
        typeof data.data.vibe.status === 'string'
      ) {
        const formattedStatus = formatWebSocketStatus(data.data.vibe.status);
        console.log('Setting WebSocket status:', formattedStatus);
        setWebSocketStatus(formattedStatus);
      } else {
        console.log('WebSocket data failed type guard check');
      }
    });

    return () => {
      if (webSocketCommunication.current) {
        webSocketCommunication.current = null;
      }
    };
  }, [anonymousUserId]);

  // Use consolidated persona user service

  // Fetch sessions and set latest sessionId on component mount or when persona changes
  useEffect(() => {
    const fetchAndSetLatestSession = async () => {
      try {
        const personaInfo = await personaUserService.getSelectedPersonaInfo(selectedPersonaId);
        const personaUserId = personaInfo?.userId;

        if (personaUserId) {
          const sessionsResponse = await chatService.getVibeSessions(undefined, personaUserId);
          const sessions = sessionsResponse.Content.vibeSessions;

          if (sessions && sessions.length > 0) {
            // Sort sessions by creation time (newest first) and get the latest one
            const latestSession = sessions.sort((a, b) => b.creationTimeInMs - a.creationTimeInMs)[0];
            setSessionId(latestSession.id);
          } else {
            // No sessions found, clear sessionId
            setSessionId('');
          }
        } else {
          // No persona selected, clear sessionId
          setSessionId('');
        }
      } catch (error) {
        console.warn('Failed to fetch sessions:', error);
        // Clear sessionId on error
        setSessionId('');
      }
    };

    fetchAndSetLatestSession();
  }, [selectedPersonaId]);

  // Load chat messages when session ID or selected persona changes
  useEffect(() => {
    if (sessionId) {
      loadChatMessages(sessionId);
    }
  }, [sessionId, scheduleId, selectedPersonaId]);

  const shouldShowAcceptButton = useHasUnexecutedActions(requestId, messages);

  useEffect(() => {
    if (messages.length > 0 && messagesListRef.current) {
      messagesListRef.current.scrollTo({
        top: messagesListRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages]);

  // Helper function to update messages with actions progressively
  const updateMessagesWithActions = (
    rawMessages: PromptWithActions[],
    actionsMap: Record<string, VibeAction>
  ) => {
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
          })(),
        }))
        .sort((a, b) => b.timestamp - a.timestamp); // Sort newest first

      const uniqueActionIds = Array.from(
        new Set(
          messagesByTimestamp.flatMap((entry) => entry.actionIds || []).filter(Boolean)
        )
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
      setRequestId(loadedMessages[loadedMessages.length - 1]?.requestId || null);
    } catch (err) {
      if (err instanceof Error) setError(err.message);
      else setError(t('home.expanded.chat.errorLoadMessages'));
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
      setWebSocketStatus(null); // Reset status to prepare for new updates

      // Get current location data
      const locationData = await locationService.getCurrentLocation();
      const locationApiData = locationService.toApiFormat(locationData);

      const response = await chatService.sendMessage(
        message,
        entityId,
        sessionId,
        anonymousUserId,
        locationApiData.userLongitude,
        locationApiData.userLatitude,
        locationApiData.userLocationVerified
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

      // Append new messages to existing state
      setMessages((prev) => [...prev, ...newMessages]);
      setRequestId(newMessages[0]?.requestId || null);

      // Update session ID from the first prompt
      const sessionIdFromResponse = newMessages[0]?.sessionId;
      if (sessionIdFromResponse) {
        setSessionId(sessionIdFromResponse);
      }

      setMessage('');
    } catch (err) {
      if (err instanceof ChatLimitError) {
        setErrorPopupMessage(err.message);
        setShowErrorPopup(true);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(t('home.expanded.chat.errorSendMessage'));
      }
    } finally {
      setIsSending(false);
    }
  };

  const acceptAllChanges = async () => {
    try {
      setIsSending(true);
      setError(null);
      setWebSocketStatus(null); // Reset status to prepare for new updates
      // Get current location data
      const locationData = await locationService.getCurrentLocation();
      const locationApiData = locationService.toApiFormat(locationData);

      const executedChanges = await chatService.sendChatAcceptChanges(
        requestId,
        anonymousUserId,
        locationApiData.userLongitude,
        locationApiData.userLatitude,
        locationApiData.userLocationVerified
      );
      const newScheduleId = executedChanges?.Content?.vibeRequest?.afterScheduleId || null;
      if (newScheduleId) {
        handleSetScheduleId(newScheduleId);
        // useEffect will automatically reload messages when scheduleId changes
      }
    } catch (err) {
      if (err instanceof Error) setError(err.message);
      else setError(t('home.expanded.chat.errorAcceptChanges'));
    } finally {
      setIsSending(false);
    }
  };

  const handleNewChat = () => {
    setSessionId('');
    setError(null);
    setMessage('');
    setMessages([]);
    setRequestId(null);
    handleSetScheduleId('');
  };

  const removeChatContext = useAppStore((state) => state.removeChatContext); // Action to remove context

  const handleRemoveContext = (context: ChatContextType) => {
    removeChatContext(context); // Remove the clicked context
  };

  return (
    <ChatWrapper>
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
          {isLoading && (
            <LoadingIndicator message={t('home.expanded.chat.loadingMessages')} />
          )}
          {isBatchLoading && (
            <LoadingIndicator message={t('home.expanded.chat.loadingActions')} />
          )}

          {error && (
            <div className="chat-error">
              {t('home.expanded.chat.error')}: {error}
            </div>
          )}

          {!isLoading && !error && !messages.length && (
            <EmptyChat>
              <Logo size={48} />
              <h3>{t('home.expanded.chat.emptyStateTitle')}</h3>
              <p>{t('home.expanded.chat.emptyStateDescription')}</p>
            </EmptyChat>
          )}

          <div className="messages-list" ref={messagesListRef}>
            {messages.map((message) => (
              <MessageBubble key={message.id} $isUser={message.origin === 'user'}>
                <div className="message-content">
                  <MarkdownRenderer content={message.content} />
                </div>

                {message.actions?.filter(action => action.type !== 'conversational_and_not_supported').map((action) => (
                  <Button
                    key={action.id}
                    variant="pill"
                    dotstatus={action.status}
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
          {isSending && (
            <>
              {console.log('LoadingIndicator - isSending:', isSending, 'webSocketStatus:', webSocketStatus)}
              <LoadingIndicator message={webSocketStatus || t('home.expanded.chat.sendingRequest')} />
            </>
          )}
          {!isSending && shouldShowAcceptButton && (
            <Button variant="primary" onClick={() => acceptAllChanges()}>
              {t('home.expanded.chat.acceptChanges')}
            </Button>
          )}
        </div>

        <ChatForm onSubmit={handleSubmit}>
          <Input.Textarea
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
            bordergradient={[palette.colors.brand[500]]}
            height={50} // Set a fixed height for consistent alignment
          />
          <ChatButton type="submit" disabled={isSending || !message.trim()}>
            {isSending ? <CircleStop size={20} /> : <SendHorizontal size={20} />}
          </ChatButton>
        </ChatForm>
        <UserLocation />
      </ChatContainer>

      <ErrorPopup
        isOpen={showErrorPopup}
        message={errorPopupMessage}
        title="Chat Limit Reached"
        onClose={() => setShowErrorPopup(false)}
        showWaitlistButton={true}
        onWaitlistClick={() => {
          window.location.href = '/waitlist';
        }}
      />
    </ChatWrapper>
  );
};

export default Chat;
