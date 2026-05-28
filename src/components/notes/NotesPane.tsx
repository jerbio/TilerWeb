import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import ReactMarkdown from 'react-markdown';
import palette from '@/core/theme/palette';
import { useTileNotes } from '@/hooks/useTileNotes';
import type { NotesScope } from '@/core/common/types/schedule';

export interface NotesPaneProps {
	eventId: string | null;
	scope?: NotesScope;
}

/**
 * Two-zone notes editor for a Tiler calendar event or sub-event:
 *  - **Agent zone**: read-only markdown rendering of `AgentNote`.
 *  - **User zone**: editable textarea bound to `UserNote`, with an etag-based
 *    save button and an in-pane conflict resolver.
 */
export const NotesPane: React.FC<NotesPaneProps> = ({ eventId, scope = 'auto' }) => {
	const { payload, isLoading, isSaving, error, conflict, save, clearConflict } = useTileNotes(
		eventId,
		scope
	);
	const [draft, setDraft] = useState<string>('');

	// Reset the draft whenever the saved payload changes (initial load, save,
	// or refresh after conflict).
	useEffect(() => {
		setDraft(payload?.UserNote ?? '');
	}, [payload?.UserNote]);

	if (isLoading) {
		return <LoadingMessage data-testid="notes-pane-loading">Loading notes…</LoadingMessage>;
	}

	if (error && !payload) {
		return (
			<ErrorMessage data-testid="notes-pane-error" role="alert">
				Couldn’t load notes. {error.message}
			</ErrorMessage>
		);
	}

	const savedNote = payload?.UserNote ?? '';
	const isDirty = draft !== savedNote;
	const agentNote = payload?.AgentNote?.trim();

	return (
		<PaneRoot>
			{agentNote && (
				<AgentSection data-testid="notes-pane-agent" aria-label="Tiler agent notes">
					<SectionLabel>Tiler suggests</SectionLabel>
					<MarkdownSurface>
						<ReactMarkdown>{agentNote}</ReactMarkdown>
					</MarkdownSurface>
				</AgentSection>
			)}

			<UserSection>
				<SectionLabel htmlFor="notes-user-textarea">Your note</SectionLabel>
				<Textarea
					id="notes-user-textarea"
					value={draft}
					onChange={(e) => setDraft(e.target.value)}
					placeholder="Add a private note for this tile…"
					rows={6}
					disabled={isSaving}
				/>

				{conflict && (
					<ConflictBanner data-testid="notes-pane-conflict" role="alert">
						<strong>Someone else updated this note.</strong>
						<ConflictColumns>
							<ConflictColumn>
								<ConflictHeading>Your draft</ConflictHeading>
								<pre>{conflict.localDraft}</pre>
							</ConflictColumn>
							<ConflictColumn>
								<ConflictHeading>Server now</ConflictHeading>
								<pre>{conflict.server.UserNote ?? ''}</pre>
							</ConflictColumn>
						</ConflictColumns>
						<ConflictActions>
							<SecondaryButton
								type="button"
								onClick={() => {
									setDraft(conflict.server.UserNote ?? '');
									clearConflict();
								}}
							>
								Discard my changes
							</SecondaryButton>
							<SecondaryButton type="button" onClick={clearConflict}>
								Keep editing
							</SecondaryButton>
						</ConflictActions>
					</ConflictBanner>
				)}

				<ActionRow>
					{payload?.AuthorUserId && (
						<Meta>
							Last edited by <code>{payload.AuthorUserId}</code>
						</Meta>
					)}
					<PrimaryButton
						type="button"
						onClick={() => void save(draft)}
						disabled={!isDirty || isSaving}
					>
						{isSaving ? 'Saving…' : 'Save'}
					</PrimaryButton>
				</ActionRow>
			</UserSection>
		</PaneRoot>
	);
};

const PaneRoot = styled.section`
	display: flex;
	flex-direction: column;
	gap: 16px;
	padding: 12px;
`;

const AgentSection = styled.div`
	border-left: 3px solid ${palette.colors.primary};
	padding: 8px 12px;
	background: rgba(0, 0, 0, 0.03);
	border-radius: 6px;
`;

const UserSection = styled.div`
	display: flex;
	flex-direction: column;
	gap: 8px;
`;

const SectionLabel = styled.label`
	font-size: 12px;
	font-weight: 600;
	text-transform: uppercase;
	letter-spacing: 0.04em;
	color: ${palette.colors.textGrey};
`;

const MarkdownSurface = styled.div`
	font-size: 14px;
	line-height: 1.5;

	h1,
	h2,
	h3 {
		margin-top: 0.5em;
		margin-bottom: 0.25em;
	}
	p {
		margin: 0.25em 0;
	}
`;

const Textarea = styled.textarea`
	font: inherit;
	padding: 8px;
	border: 1px solid rgba(0, 0, 0, 0.15);
	border-radius: 6px;
	resize: vertical;
	min-height: 120px;
`;

const ActionRow = styled.div`
	display: flex;
	align-items: center;
	justify-content: flex-end;
	gap: 12px;
`;

const Meta = styled.span`
	margin-right: auto;
	font-size: 12px;
	color: ${palette.colors.textGrey};
`;

const PrimaryButton = styled.button`
	padding: 8px 16px;
	border-radius: 6px;
	border: none;
	background: ${palette.colors.primary};
	color: #fff;
	cursor: pointer;

	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
`;

const SecondaryButton = styled.button`
	padding: 6px 12px;
	border-radius: 6px;
	border: 1px solid rgba(0, 0, 0, 0.2);
	background: transparent;
	cursor: pointer;
`;

const ConflictBanner = styled.div`
	border: 1px solid #d97706;
	background: #fef3c7;
	color: #78350f;
	border-radius: 6px;
	padding: 8px 12px;
	display: flex;
	flex-direction: column;
	gap: 8px;
`;

const ConflictColumns = styled.div`
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 8px;
`;

const ConflictColumn = styled.div`
	background: rgba(255, 255, 255, 0.6);
	padding: 6px;
	border-radius: 4px;

	pre {
		white-space: pre-wrap;
		word-break: break-word;
		margin: 4px 0 0;
		font-family: inherit;
	}
`;

const ConflictHeading = styled.div`
	font-size: 11px;
	text-transform: uppercase;
	letter-spacing: 0.04em;
	font-weight: 700;
`;

const ConflictActions = styled.div`
	display: flex;
	gap: 8px;
	justify-content: flex-end;
`;

const LoadingMessage = styled.div`
	padding: 12px;
	font-size: 13px;
	color: ${palette.colors.textGrey};
`;

const ErrorMessage = styled.div`
	padding: 12px;
	font-size: 13px;
	color: #b91c1c;
`;

export default NotesPane;
