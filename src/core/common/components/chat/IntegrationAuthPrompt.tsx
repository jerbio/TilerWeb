import React, { useState } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import { chatService } from '@/services';
import Button from '@/core/common/components/button';

/**
 * M10.5 — chip rendered when the orchestrator emits
 * `RESEARCH_AWAITING_INTEGRATION_AUTH`. Surfaces the OAuth initiation URL,
 * lets the user complete the flow out-of-band, and then POSTs to
 * `/CompleteIntegrationAuth` to resume the suspended plan. The actual OAuth
 * callback payload is wired by production deployments — the in-memory test
 * service treats any non-empty payload as a successful authorization, so the
 * resume button submits a sentinel value.
 */
export interface IntegrationAuthData {
	gateId: string;
	integrationKey: string;
	oauthInitiationUrl?: string;
	stepDescription?: string;
}

interface IntegrationAuthPromptProps {
	vibeRequestId: string;
	gate: IntegrationAuthData;
	onResolved: () => void;
}

const Container = styled.div`
	display: flex;
	flex-direction: column;
	gap: 0.75rem;
	margin: 0.5rem 0;
	border: 1px solid ${({ theme }) => theme.colors.border.default};
	border-radius: ${({ theme }) => theme.borderRadius.medium};
	padding: 1rem;
	background: ${({ theme }) => theme.colors.background.card2};
`;

const Message = styled.p`
	margin: 0;
	font-size: ${({ theme }) => theme.typography.fontSize.sm};
	color: ${({ theme }) => theme.colors.text.primary};
	line-height: 1.5;
`;

const AuthLink = styled.a`
	font-size: ${({ theme }) => theme.typography.fontSize.sm};
	color: ${({ theme }) => theme.colors.brand[400]};
	text-decoration: underline;
	word-break: break-all;
`;

const ActionsRow = styled.div`
	display: flex;
	gap: 0.5rem;
	justify-content: flex-end;
`;

const ResolvedMessage = styled.div`
	font-size: ${({ theme }) => theme.typography.fontSize.sm};
	color: ${({ theme }) => theme.colors.text.muted};
	padding: 0.5rem;
	font-style: italic;
`;

type PromptState = 'ready' | 'submitting' | 'resolved' | 'dismissed' | 'error';

// Sentinel value sent when the user manually confirms they completed the OAuth
// flow. Production wiring intercepts the real callback and substitutes the
// actual provider payload (authorization code, granted scopes, state token).
const FE_USER_COMPLETED_PAYLOAD = 'fe_user_completed=1';

const IntegrationAuthPrompt: React.FC<IntegrationAuthPromptProps> = ({
	vibeRequestId,
	gate,
	onResolved,
}) => {
	const { t } = useTranslation();
	const [state, setState] = useState<PromptState>('ready');
	const [opened, setOpened] = useState(false);

	const integrationLabel =
		gate.integrationKey ||
		t('home.expanded.chat.integrationAuth.thisIntegration', 'this integration');

	const handleOpen = () => {
		if (gate.oauthInitiationUrl) {
			window.open(gate.oauthInitiationUrl, '_blank', 'noopener,noreferrer');
			setOpened(true);
		}
	};

	const handleComplete = async () => {
		setState('submitting');
		try {
			await chatService.completeIntegrationAuth(
				vibeRequestId,
				gate.gateId,
				gate.integrationKey,
				FE_USER_COMPLETED_PAYLOAD
			);
			setState('resolved');
			onResolved();
		} catch {
			setState('error');
		}
	};

	const handleDismiss = () => {
		setState('dismissed');
		onResolved();
	};

	if (state === 'resolved') {
		return (
			<ResolvedMessage>
				{t('home.expanded.chat.integrationAuth.completed', 'Authorization completed')}
			</ResolvedMessage>
		);
	}

	if (state === 'dismissed') {
		return (
			<ResolvedMessage>
				{t('home.expanded.chat.integrationAuth.dismissed', 'Authorization dismissed')}
			</ResolvedMessage>
		);
	}

	return (
		<Container>
			<Message>
				{t(
					'home.expanded.chat.integrationAuth.pendingMessage',
					'{{integration}} requires authorization before this step can continue.',
					{ integration: integrationLabel }
				)}
			</Message>
			{gate.oauthInitiationUrl && (
				<AuthLink
					href={gate.oauthInitiationUrl}
					target="_blank"
					rel="noopener noreferrer"
					onClick={() => setOpened(true)}
				>
					{t('home.expanded.chat.integrationAuth.openLink', 'Open authorization page')}
				</AuthLink>
			)}
			{state === 'error' && (
				<Message role="alert">
					{t(
						'home.expanded.chat.integrationAuth.failed',
						'Authorization did not complete. Try again.'
					)}
				</Message>
			)}
			<ActionsRow>
				<Button
					variant="secondary"
					onClick={handleDismiss}
					disabled={state === 'submitting'}
				>
					{t('home.expanded.chat.integrationAuth.dismiss', 'Dismiss')}
				</Button>
				{gate.oauthInitiationUrl && !opened && (
					<Button variant="primary" onClick={handleOpen}>
						{t('home.expanded.chat.integrationAuth.authorize', 'Authorize')}
					</Button>
				)}
				<Button
					variant="primary"
					onClick={handleComplete}
					disabled={state === 'submitting' || (!!gate.oauthInitiationUrl && !opened)}
				>
					{state === 'submitting'
						? t('home.expanded.chat.integrationAuth.submitting', 'Verifying…')
						: t(
								'home.expanded.chat.integrationAuth.completeButton',
								"I've completed authorization"
							)}
				</Button>
			</ActionsRow>
		</Container>
	);
};

export default IntegrationAuthPrompt;
