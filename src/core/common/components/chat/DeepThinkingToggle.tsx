import React from 'react';
import styled from 'styled-components';
import { BrainCircuit } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface DeepThinkingToggleProps {
	enabled: boolean;
	onToggle: (next: boolean) => void;
	disabled?: boolean;
}

/**
 * Unified Research Path M6 — DeepThinking toggle.
 *
 * Pure controlled component. When enabled, the parent should forward
 * `deepThinking=true` to `chatService.sendMessage`, which serializes
 * `DeepThinking: true` on the POST body. The backend then stamps
 * `VibeRequest.ThinkingMode = Deep`, bypassing the classifier hint.
 */
const ToggleButton = styled.button<{ $active: boolean }>`
	display: inline-flex;
	align-items: center;
	gap: 0.35rem;
	padding: 0.35rem 0.6rem;
	border-radius: ${({ theme }) => theme.borderRadius.medium};
	border: 1px solid
		${({ theme, $active }) => ($active ? theme.colors.brand[500] : theme.colors.border.default)};
	background: ${({ theme, $active }) => ($active ? theme.colors.brand[500] : 'transparent')};
	color: ${({ theme, $active }) =>
		$active ? theme.colors.text.inverse : theme.colors.text.muted};
	font-size: ${({ theme }) => theme.typography.fontSize.xs};
	font-family: ${({ theme }) => theme.typography.fontFamily.inter};
	cursor: pointer;
	user-select: none;

	&:disabled {
		cursor: not-allowed;
		opacity: 0.5;
	}

	&:focus-visible {
		outline: 2px solid ${({ theme }) => theme.colors.brand[400]};
		outline-offset: 2px;
	}
`;

const DeepThinkingToggle: React.FC<DeepThinkingToggleProps> = ({ enabled, onToggle, disabled }) => {
	const { t } = useTranslation();
	const label = t('home.expanded.chat.deepThinking', { defaultValue: 'Deep thinking' });
	return (
		<ToggleButton
			type="button"
			role="switch"
			aria-checked={enabled}
			aria-pressed={enabled}
			aria-label={label}
			$active={enabled}
			disabled={disabled}
			onClick={() => onToggle(!enabled)}
			data-testid="deep-thinking-toggle"
		>
			<BrainCircuit size={14} aria-hidden="true" />
			<span>{label}</span>
		</ToggleButton>
	);
};

export default DeepThinkingToggle;
