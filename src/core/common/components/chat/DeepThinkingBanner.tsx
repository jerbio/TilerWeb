import React from 'react';
import styled from 'styled-components';
import { Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface DeepThinkingBannerProps {
	visible: boolean;
}

/**
 * Unified Research Path M6.4 — Deep-mode banner.
 *
 * Renders a non-blocking informational banner above the chat composer
 * whenever the DeepThinking toggle is engaged. Surfaces to the user that
 * the next request will run in Deep mode (longer latency, broader research)
 * so they can disable it if they wanted Quick/Standard.
 *
 * Pure presentational. No global state, no API calls — visibility is
 * driven entirely by the parent's toggle state.
 */
const Container = styled.div`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	padding: 0.5rem 0.75rem;
	margin: 0.25rem 0;
	border-radius: ${({ theme }) => theme.borderRadius.medium};
	border: 1px solid ${({ theme }) => theme.colors.brand[400]};
	background: ${({ theme }) => theme.colors.background.card2};
	color: ${({ theme }) => theme.colors.text.primary};
	font-size: ${({ theme }) => theme.typography.fontSize.xs};
	font-family: ${({ theme }) => theme.typography.fontFamily.inter};
`;

const Icon = styled(Sparkles)`
	color: ${({ theme }) => theme.colors.brand[500]};
	flex-shrink: 0;
`;

const DeepThinkingBanner: React.FC<DeepThinkingBannerProps> = ({ visible }) => {
	const { t } = useTranslation();
	if (!visible) return null;
	const message = t('home.expanded.chat.deepThinkingBanner', {
		defaultValue:
			'Deep thinking is on. The next message will run a broader research plan and may take longer.',
	});
	return (
		<Container role="status" aria-live="polite" data-testid="deep-thinking-banner">
			<Icon size={14} aria-hidden="true" />
			<span>{message}</span>
		</Container>
	);
};

export default DeepThinkingBanner;
