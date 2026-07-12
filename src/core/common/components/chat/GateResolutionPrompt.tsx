import React, { useState } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import { chatService } from '@/services';
import Button from '@/core/common/components/button';

/**
 * M10.5 — chip rendered when the orchestrator emits
 * `RESEARCH_AWAITING_GATE_RESOLUTION` (subject disambiguation, artifact selection,
 * etc.). Collects a free-form natural-language selection and POSTs it to
 * `/ResolveGate` to resume the suspended plan.
 */
export interface GateResolutionData {
	gateId: string;
	gateKind?: string;
	stepDescription?: string;
	resultSummary?: string;
	/** Optional artifact ids the upstream resolver supplied as candidates (TDD §4.8.2). */
	candidateArtifactIds?: string[];
}

interface GateResolutionPromptProps {
	vibeRequestId: string;
	gate: GateResolutionData;
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
	font-family: ${({ theme }) => theme.typography.fontFamily.inter};
	color: ${({ theme }) => theme.colors.text.primary};
	line-height: 1.5;
`;

const Input = styled.input`
	padding: 0.5rem;
	border: 1px solid ${({ theme }) => theme.colors.border.default};
	border-radius: ${({ theme }) => theme.borderRadius.small};
	font-size: ${({ theme }) => theme.typography.fontSize.sm};
	font-family: ${({ theme }) => theme.typography.fontFamily.inter};
	background: ${({ theme }) => theme.colors.background.card};
	color: ${({ theme }) => theme.colors.text.primary};

	&:focus {
		outline: none;
		border-color: ${({ theme }) => theme.colors.brand[400]};
	}
`;

const ActionsRow = styled.div`
	display: flex;
	gap: 0.5rem;
	justify-content: flex-end;
`;

const CandidatesRow = styled.div`
	display: flex;
	flex-wrap: wrap;
	gap: 0.375rem;
`;

const CandidateChip = styled.button`
	padding: 0.25rem 0.625rem;
	border: 1px solid ${({ theme }) => theme.colors.border.default};
	border-radius: ${({ theme }) => theme.borderRadius.small};
	background: ${({ theme }) => theme.colors.background.card};
	color: ${({ theme }) => theme.colors.text.primary};
	font-size: ${({ theme }) => theme.typography.fontSize.xs};
	font-family: ${({ theme }) => theme.typography.fontFamily.inter};
	cursor: pointer;

	&:hover:not(:disabled) {
		border-color: ${({ theme }) => theme.colors.brand[400]};
	}

	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
`;

const ResolvedMessage = styled.div`
	font-size: ${({ theme }) => theme.typography.fontSize.sm};
	color: ${({ theme }) => theme.colors.text.muted};
	padding: 0.5rem;
	font-style: italic;
`;

type PromptState = 'ready' | 'submitting' | 'resolved' | 'dismissed';

const GateResolutionPrompt: React.FC<GateResolutionPromptProps> = ({
	vibeRequestId,
	gate,
	onResolved,
}) => {
	const { t } = useTranslation();
	const [state, setState] = useState<PromptState>('ready');
	const [selection, setSelection] = useState('');

	const promptText =
		gate.resultSummary ||
		gate.stepDescription ||
		t('home.expanded.chat.gate.defaultPrompt', 'Which one did you mean?');

	const handleSubmit = async () => {
		if (!selection.trim()) return;
		setState('submitting');
		try {
			await chatService.resolveGate(vibeRequestId, gate.gateId, selection.trim());
			setState('resolved');
			onResolved();
		} catch {
			setState('ready');
		}
	};

	const handleDismiss = () => {
		setState('dismissed');
		onResolved();
	};

	if (state === 'resolved') {
		return (
			<ResolvedMessage>
				{t('home.expanded.chat.gate.submitted', 'Selection submitted')}
			</ResolvedMessage>
		);
	}

	if (state === 'dismissed') {
		return (
			<ResolvedMessage>
				{t('home.expanded.chat.gate.dismissed', 'Selection dismissed')}
			</ResolvedMessage>
		);
	}

	return (
		<Container>
			<Message>{promptText}</Message>
			{gate.candidateArtifactIds && gate.candidateArtifactIds.length > 0 && (
				<CandidatesRow
					role="group"
					aria-label={t('home.expanded.chat.gate.candidatesLabel', 'Candidates')}
				>
					{gate.candidateArtifactIds.map((id) => (
						<CandidateChip
							key={id}
							type="button"
							disabled={state === 'submitting'}
							onClick={() => setSelection(id)}
						>
							{id}
						</CandidateChip>
					))}
				</CandidatesRow>
			)}
			<Input
				type="text"
				placeholder={t('home.expanded.chat.gate.placeholder', 'Type your selection…')}
				value={selection}
				onChange={(e) => setSelection(e.target.value)}
				disabled={state === 'submitting'}
				onKeyDown={(e) => {
					if (e.key === 'Enter' && !e.shiftKey) {
						e.preventDefault();
						handleSubmit();
					}
				}}
			/>
			<ActionsRow>
				<Button
					variant="secondary"
					onClick={handleDismiss}
					disabled={state === 'submitting'}
				>
					{t('home.expanded.chat.gate.dismiss', 'Dismiss')}
				</Button>
				<Button
					variant="primary"
					onClick={handleSubmit}
					disabled={state === 'submitting' || !selection.trim()}
				>
					{state === 'submitting'
						? t('home.expanded.chat.gate.submitting', 'Submitting…')
						: t('home.expanded.chat.gate.submit', 'Submit')}
				</Button>
			</ActionsRow>
		</Container>
	);
};

export default GateResolutionPrompt;
