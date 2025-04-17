import React from 'react';
import { ChatMessage as ChatMessageType } from '../types/chat';
import './ChatMessage.css';

interface ChatMessageProps {
    message: ChatMessageType;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
    return (
        <div
            className={`chat-message ${message.origin === 'user' ? 'user-message' : 'model-message'}`}
        >
            <div className="message-content">
                {message.content}
            </div>
            <div className="message-metadata">
                <span className="message-origin">{message.origin}</span>
                <span className="message-id">{message.id.split('_')[0]}</span>
            </div>
        </div>
    );
};

export default ChatMessage; 