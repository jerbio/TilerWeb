import React from 'react';
import styled from 'styled-components';
import HORIZONTALPROGRESSBAR from '@/assets/horizontal_progress_bar.gif';

const LoadingContainer = styled.div`
	margin-bottom: 0.5rem;
	display: flex;
	align-items: center;
	justify-content: center;
	flex-direction: column;
`;

const LoadingText = styled.span`
	margin-bottom: 0.5rem;
	color: #ffffff;
	font-size: 14px;
`;

const LoadingImage = styled.img`
	width: 100%;
	height: 24px;
	margin-right: 0.5rem;
`;

interface LoadingIndicatorProps {
	message?: string;
	className?: string;
	style?: React.CSSProperties;
}

const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({ 
	message = "Loading...", 
	className,
	style 
}) => {
	return (
		<LoadingContainer className={className} style={style}>
			<LoadingText>{message}</LoadingText>
			<LoadingImage
				src={HORIZONTALPROGRESSBAR}
				alt="Loading..."
			/>
		</LoadingContainer>
	);
};

export default LoadingIndicator;