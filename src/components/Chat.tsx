import React, { useEffect, useState, FormEvent, useRef } from 'react';
import { Prompt, VibeAction, VibeActionStatus } from '../types/chat';
import { 
    fetchChatMessages, 
    sendChatMessage, 
    getStoredSessionId, 
    clearStoredSessionId,
    fetchAction
} from '../services/chatService';
import './Chat.css';

const Chat: React.FC = () => {
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [sessionId, setSessionId] = useState<string>('');
    const [isSending, setIsSending] = useState(false);
    const [messages, setMessages] = useState<Prompt[]>([]);
    const [lastFetchedAction, setLastFetchedAction] = useState<VibeAction | null>(null);

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

    const handleActionFetch = async (actionId: string) => {
        try {
            setIsLoading(true);
            setError(null);
            const action = await fetchAction(actionId);
            console.log('Fetched action:', action);

            setLastFetchedAction(action); // Set the entire VibeAction object

            return action;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch action');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (messages.length > 0) {
            const latestMessage = messages[0];
            if (latestMessage.actionId) {
                handleActionFetch(latestMessage.actionId);
            }
        }
    }, [messages]);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!message.trim() || isSending) return;

        try {
            setIsSending(true);
            setError(null);

            // Determine if actionId should be included
            const actionIdToSend =
                lastFetchedAction &&
                (lastFetchedAction.status === VibeActionStatus.Clarification ||
                    lastFetchedAction.status === VibeActionStatus.None)
                    ? lastFetchedAction.id
                    : undefined;

            const response = await sendChatMessage(
                message,
                sessionId,
                undefined, // requestId
                actionIdToSend // Conditionally include actionId
            );

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
            setMessages(prev => [...responseMessages, ...prev]);

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

    return (
        <div className="chat-wrapper">
            <div className="chat-header">
                <h2>Chat</h2>
                <button 
                    onClick={handleNewChat}
                    className="new-chat-button"
                    disabled={isSending}
                >
                    New Chat
                </button>
            </div>
            <div className="chat-container">
                {isLoading && <div className="chat-loading">Loading chat messages...</div>}
                {error && <div className="chat-error">Error: {error}</div>}
                {!isLoading && !error && !messages.length && (
                    <div className="chat-empty">No messages yet. Start a conversation!</div>
                )}
                <div className="messages-list">
                    {[...messages].reverse().map(message => (
                        <div key={message.id} className={`message ${message.origin === 'user' ? 'user-message' : 'model-message'}`}>
                            <div className="message-content">{message.content}</div>
                            <div className="message-timestamp">
                                {new Date(parseInt(message.id.split('_').slice(-2, -1)[0])).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                        </div>
                    ))}
                </div>
                <div ref={messagesEndRef} />
            </div>
            <form onSubmit={handleSubmit} className="chat-input-form">
                <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type your message..."
                    disabled={isSending}
                    className="chat-input"
                />
                <button 
                    type="submit" 
                    disabled={isSending || !message.trim()} 
                    className="chat-send-button"
                >
                    {isSending ? 'Sending...' : 'Send'}
                </button>
            </form>
        </div>
    );
};

export default Chat;