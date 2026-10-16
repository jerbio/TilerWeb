import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, UserRound, Users } from 'lucide-react';
import styled from 'styled-components';
import { DirectorySearchPage, VibeAction } from '@/core/common/types/chat';

export interface DirectorySearchCardProps {
	action: VibeAction;
	disabled?: boolean;
	onSelect: (matchId: string, signal: AbortSignal) => Promise<DirectorySearchPage>;
	onChanged: (page: DirectorySearchPage) => void;
}

const Card = styled.section`
	margin-block: 12px;
	padding: 14px;
	border: 1px solid ${({ theme }) => theme.colors.border.default};
	border-radius: 12px;
	background: ${({ theme }) => theme.colors.background.card};
	color: ${({ theme }) => theme.colors.text.primary};
	h4 {
		margin: 0 0 8px;
	}
	p {
		margin: 8px 0;
		font-size: 13px;
		color: ${({ theme }) => theme.colors.text.secondary};
	}
	ul {
		list-style: none;
		padding: 0;
		margin: 10px 0;
		display: grid;
		gap: 8px;
	}
	[role='alert'] {
		color: ${({ theme }) => theme.colors.text.error};
	}
`;
const Choice = styled.button`
	width: 100%;
	display: flex;
	align-items: center;
	gap: 10px;
	padding: 12px;
	border-radius: 8px;
	text-align: left;
	cursor: pointer;
	border: 1px solid ${({ theme }) => theme.colors.border.default};
	background: ${({ theme }) => theme.colors.background.card2};
	color: ${({ theme }) => theme.colors.text.primary};
	> span {
		flex: 1;
		min-width: 0;
		overflow-wrap: anywhere;
	}
	small {
		display: block;
		margin-top: 4px;
		color: ${({ theme }) => theme.colors.text.secondary};
	}
	svg {
		flex-shrink: 0;
	}
	&[aria-pressed='true'] {
		border-color: ${({ theme }) => theme.colors.preview.selectedBorder};
		background: ${({ theme }) => theme.colors.preview.selectedBg};
		color: ${({ theme }) => theme.colors.preview.selectedText};
		small {
			color: inherit;
		}
	}
	&:hover:not(:disabled),
	&:focus-visible {
		outline: 2px solid ${({ theme }) => theme.colors.border.strong};
		outline-offset: 2px;
	}
	&:disabled {
		cursor: default;
	}
`;

export default function DirectorySearchCard({
	action,
	disabled = false,
	onSelect,
	onChanged,
}: DirectorySearchCardProps) {
	const { t } = useTranslation();
	const page = action.directorySearch;
	const pending = useRef<AbortController | null>(null);
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState(false);
	useEffect(() => {
		setBusy(false);
		setError(false);
		return () => {
			pending.current?.abort();
			pending.current = null;
		};
	}, [action.id, page?.ResultId, disabled]);
	if (!page) return null;
	const team = page.Kind === 'Team';
	const Icon = team ? Users : UserRound;
	const select = async (id: string) => {
		if (disabled || pending.current || !page.ResultId) return;
		const request = new AbortController();
		pending.current = request;
		setBusy(true);
		setError(false);
		try {
			const saved = await onSelect(id, request.signal);
			if (!request.signal.aborted) onChanged(saved);
		} catch {
			if (!request.signal.aborted) setError(true);
		} finally {
			if (!request.signal.aborted) {
				pending.current = null;
				setBusy(false);
			}
		}
	};
	return (
		<Card aria-label={t('chat.directory.label', 'Directory search')} aria-busy={busy}>
			<h4>
				{team
					? t('chat.directory.teams', 'Your teams')
					: t('chat.directory.contacts', 'Your contacts')}
			</h4>
			<p>
				{t(
					'chat.directory.note',
					'Choose the intended contact or team. Selection does not send an invitation or grant access.'
				)}
			</p>
			{page.Matches.length === 0 ? (
				<p>
					{t(
						'chat.directory.empty',
						'No matches. Try a different name, email, or phone in chat.'
					)}
				</p>
			) : (
				<ul>
					{page.Matches.map((match) => (
						<li key={match.Id}>
							<Choice
								type="button"
								aria-pressed={page.Selection?.Id === match.Id}
								disabled={disabled || busy || !page.ResultId}
								onClick={() => void select(match.Id)}
							>
								<Icon size={20} aria-hidden="true" />
								<span>
									{match.Name}
									<small>
										{team
											? match.TeamPath?.map((p) => p.Name).join(' / ')
											: [match.EmailHint, match.PhoneHint]
													.filter(Boolean)
													.join(' · ')}
									</small>
								</span>
								{page.Selection?.Id === match.Id && (
									<Check size={18} aria-hidden="true" />
								)}
							</Choice>
						</li>
					))}
				</ul>
			)}
			<p role="status">
				{busy
					? t('chat.directory.saving', 'Confirming selection…')
					: page.Selection
						? `${t('chat.directory.selected', 'Selected')}: ${page.Selection.Name}`
						: t('chat.directory.notSelected', 'No recipient selected.')}
			</p>
			{error && (
				<p role="alert">
					{t(
						'chat.directory.error',
						'Could not confirm the selection. Try again, or search again if the results changed.'
					)}
				</p>
			)}
			{page.HasMore && (
				<p>
					{t(
						'chat.directory.more',
						'More matches are available. Refine the name, email, or phone in chat to narrow the results.'
					)}
				</p>
			)}
			{(disabled || !page.ResultId) && (
				<p>
					{t(
						'chat.directory.stale',
						'Search again in the current chat to choose from fresh results.'
					)}
				</p>
			)}
		</Card>
	);
}
