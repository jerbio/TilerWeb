import React, { useState } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import { chatService } from '@/services';
import ServerError from '@/core/error/server';
import Button from '@/core/common/components/button';

interface MissingParameter {
	parameterName: string;
	description: string;
	isRequired: boolean;
	suggestedValues?: string[];
	inputType?: 'text' | 'date' | 'number';
	choices?: Array<{ label: string; value: string }>;
}

interface ClarificationData {
	stepId: string;
	clarificationId?: string;
	providerMessage: string;
	missingParameters: MissingParameter[];
}

interface ClarificationPromptProps {
	vibeRequestId: string;
	anonymousUserId?: string;
	clarification: ClarificationData;
	onResolved: () => void;
	onSubmitted?: () => void;
	onProcessingChange?: (processing: boolean) => void;
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

const ProviderMessage = styled.p`
	margin: 0;
	font-size: ${({ theme }) => theme.typography.fontSize.sm};
	font-family: ${({ theme }) => theme.typography.fontFamily.inter};
	color: ${({ theme }) => theme.colors.text.primary};
	line-height: 1.5;
`;

const FieldGroup = styled.div`
	display: flex;
	flex-direction: column;
	gap: 0.25rem;
`;

const FieldLabel = styled.label`
	font-size: ${({ theme }) => theme.typography.fontSize.xs};
	font-family: ${({ theme }) => theme.typography.fontFamily.inter};
	color: ${({ theme }) => theme.colors.text.muted};
`;

const RequiredMark = styled.span`
	color: ${({ theme }) => theme.colors.text.error};
	margin-left: 2px;
`;

const FieldInput = styled.input`
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

const FieldSelect = styled.select`
	padding: 0.5rem;
	border: 1px solid ${({ theme }) => theme.colors.border.default};
	border-radius: ${({ theme }) => theme.borderRadius.small};
	font-size: ${({ theme }) => theme.typography.fontSize.sm};
	font-family: ${({ theme }) => theme.typography.fontFamily.inter};
	background: ${({ theme }) => theme.colors.background.card};
	color: ${({ theme }) => theme.colors.text.primary};
`;

const ActionsRow = styled.div`
	display: flex;
	gap: 0.5rem;
	justify-content: flex-end;
	margin-top: 0.25rem;
`;

const ResolvedMessage = styled.div`
	font-size: ${({ theme }) => theme.typography.fontSize.sm};
	font-family: ${({ theme }) => theme.typography.fontFamily.inter};
	color: ${({ theme }) => theme.colors.text.muted};
	padding: 0.5rem;
	font-style: italic;
`;

type PromptState = 'ready' | 'submitting' | 'resolved' | 'dismissed' | 'error';

const ClarificationPrompt: React.FC<ClarificationPromptProps> = ({
	vibeRequestId,
	anonymousUserId,
	clarification,
	onResolved,
	onSubmitted,
	onProcessingChange,
}) => {
	const { t } = useTranslation();
	const [state, setState] = useState<PromptState>('ready');
	const [submissionError, setSubmissionError] = useState<string | null>(null);
	const [values, setValues] = useState<Record<string, string>>(() => {
		const initial: Record<string, string> = {};
		clarification.missingParameters.forEach((p) => {
			initial[p.parameterName] = '';
		});
		return initial;
	});

	const handleChange = (paramName: string, value: string) => {
		setValues((prev) => ({ ...prev, [paramName]: value }));
	};

	const handleSubmit = async () => {
		setSubmissionError(null);
		setState('submitting');
		onProcessingChange?.(true);
		try {
			if (clarification.clarificationId || anonymousUserId) {
				await chatService.supplyClarification(vibeRequestId, clarification.stepId, values, {
					clarificationId: clarification.clarificationId,
					anonymousUserId,
				});
			} else {
				await chatService.supplyClarification(vibeRequestId, clarification.stepId, values);
			}
			setState('resolved');
			onResolved();
			onSubmitted?.();
		} catch (error) {
			// Only a recognized pre-resume rejection establishes that execution did not
			// start. Network failures and unknown errors still require reconciliation.
			const details =
				error instanceof ServerError &&
				error.status === 400 &&
				error.details &&
				typeof error.details === 'object'
					? (error.details as Record<string, unknown>)
					: undefined;
			const code = details?.Code ?? details?.code;
			const message = details?.Message ?? details?.message;
			const knownRejection =
				code === 'ClarificationAnswerRejected' || code === 'ClarificationQuestionChanged';
			setSubmissionError(
				knownRejection &&
					typeof message === 'string' &&
					message.length > 0 &&
					message.length <= 600
					? message
					: t(
							'home.expanded.chat.clarification.submitFailed',
							'Unable to confirm the result. Your answer is retained. Refresh to check the current status before retrying.'
						)
			);
			setState('ready');
		} finally {
			onProcessingChange?.(false);
		}
	};

	const handleDismiss = () => {
		setState('dismissed');
		onResolved();
	};

	const hasRequiredEmpty = clarification.missingParameters
		.filter((p) => p.isRequired)
		.some((p) => !values[p.parameterName]?.trim());

	if (state === 'resolved') {
		return (
			<ResolvedMessage>
				{t('home.expanded.chat.clarification.submitted', 'Clarification submitted')}
			</ResolvedMessage>
		);
	}

	if (state === 'dismissed') {
		return (
			<ResolvedMessage>
				{t('home.expanded.chat.clarification.dismissed', 'Clarification dismissed')}
			</ResolvedMessage>
		);
	}

	return (
		<Container>
			<ProviderMessage>{clarification.providerMessage}</ProviderMessage>
			{submissionError && <ProviderMessage role="alert">{submissionError}</ProviderMessage>}
			{clarification.missingParameters.map((param) => (
				<FieldGroup key={param.parameterName}>
					<FieldLabel
						htmlFor={`${clarification.clarificationId ?? clarification.stepId}-${param.parameterName}`}
					>
						{param.description || param.parameterName}
						{param.isRequired && <RequiredMark>*</RequiredMark>}
					</FieldLabel>
					{param.choices?.length || param.suggestedValues?.length ? (
						<FieldSelect
							id={`${clarification.clarificationId ?? clarification.stepId}-${param.parameterName}`}
							value={values[param.parameterName] || ''}
							onChange={(e) => handleChange(param.parameterName, e.target.value)}
							disabled={state === 'submitting'}
						>
							<option value="">
								{t('home.expanded.chat.clarification.selectOption', 'Select...')}
							</option>
							{(
								param.choices ??
								param.suggestedValues?.map((value) => ({ label: value, value })) ??
								[]
							).map((choice) => (
								<option key={choice.value} value={choice.value}>
									{choice.label}
								</option>
							))}
						</FieldSelect>
					) : (
						<FieldInput
							id={`${clarification.clarificationId ?? clarification.stepId}-${param.parameterName}`}
							type={param.inputType ?? 'text'}
							placeholder={param.description || param.parameterName}
							value={values[param.parameterName] || ''}
							onChange={(e) => handleChange(param.parameterName, e.target.value)}
							disabled={state === 'submitting'}
						/>
					)}
				</FieldGroup>
			))}
			<ActionsRow>
				<Button
					variant="secondary"
					onClick={handleDismiss}
					disabled={state === 'submitting'}
				>
					{t('home.expanded.chat.clarification.dismiss', 'Dismiss')}
				</Button>
				<Button
					variant="primary"
					onClick={handleSubmit}
					disabled={state === 'submitting' || hasRequiredEmpty}
				>
					{state === 'submitting'
						? t('home.expanded.chat.clarification.submitting', 'Submitting...')
						: t('home.expanded.chat.clarification.submit', 'Submit')}
				</Button>
			</ActionsRow>
		</Container>
	);
};

export default ClarificationPrompt;
