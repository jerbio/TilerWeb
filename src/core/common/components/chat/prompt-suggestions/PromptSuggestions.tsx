import React from 'react';
import styled, { keyframes } from 'styled-components';

export interface PromptSuggestionsProps {
	/** Keyed suggestions from the backend: { "sug_abc": "Plan my day", ... } */
	suggestions: Record<string, string>;
	isLoading: boolean;
	onPromptClick: (key: string, text: string) => void;
}

const Container = styled.div`
	display: grid;
	grid-template-columns: repeat(3, 1fr);
	gap: 6px;
	padding: 16px 0;
	width: 100%;

	@media (max-width: 768px) {
		grid-template-columns: repeat(2, 1fr);
	}

	@media (max-width: 480px) {
		grid-template-columns: 1fr;
	}
`;

const PromptPill = styled.button`
	background: ${({ theme }) => theme.colors.background.card2};
	border: 1px solid ${({ theme }) => theme.colors.border.default};
	border-radius: 16px;
	padding: 8px 12px;
	font-size: 12px;
	font-weight: 400;
	color: ${({ theme }) => theme.colors.text.secondary};
	cursor: pointer;
	transition: all 0.2s ease;
	text-align: center;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;

	&:hover {
		background: ${({ theme }) => theme.colors.button.ghost.bgHover};
		border-color: ${({ theme }) => theme.colors.border.default};
		color: ${({ theme }) => theme.colors.text.primary};
		transform: translateY(-1px);
	}

	&:active {
		transform: translateY(0);
	}
`;

const shimmer = keyframes`
	0%   { opacity: 0.4; }
	50%  { opacity: 0.8; }
	100% { opacity: 0.4; }
`;

const SkeletonPill = styled.div.attrs({ role: 'presentation' })`
	height: 34px;
	border-radius: 16px;
	background: ${({ theme }) => theme.colors.background.card2};
	animation: ${shimmer} 1.4s ease-in-out infinite;
`;

/** Number of skeleton pills shown while suggestions are loading. */
const SKELETON_COUNT = 5;

const PromptSuggestions: React.FC<PromptSuggestionsProps> = ({
	suggestions,
	isLoading,
	onPromptClick,
}) => {
	if (isLoading) {
		return (
			<Container>
				{Array.from({ length: SKELETON_COUNT }).map((_, i) => (
					<SkeletonPill key={i} />
				))}
			</Container>
		);
	}

	const entries = Object.entries(suggestions);
	if (entries.length === 0) return null;

	return (
		<Container>
			{entries.map(([key, text]) => (
				<PromptPill key={key} onClick={() => onPromptClick(key, text)} title={text}>
					{text}
				</PromptPill>
			))}
		</Container>
	);
};

export default PromptSuggestions;
