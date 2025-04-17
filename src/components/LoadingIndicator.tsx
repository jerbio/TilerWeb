import React from 'react';
import './LoadingIndicator.css';

export const LoadingIndicator: React.FC = () => (
    <div className="loading-indicator">
        <div className="loading-spinner"></div>
        <span>Loading...</span>
    </div>
); 