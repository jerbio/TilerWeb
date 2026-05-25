import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import {
	ArrowLeft,
	X,
	Bold,
	Italic,
	Underline as UnderlineIcon,
	Strikethrough,
	Code,
	Heading1,
	Heading2,
	Heading3,
	List,
	ListOrdered,
	ListChecks,
	Quote,
	Link as LinkIcon,
	Undo2,
	Redo2,
	Loader2,
	CheckCircle2,
	AlertTriangle,
} from 'lucide-react';
import { useEditor, EditorContent, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import { Markdown } from 'tiptap-markdown';
import palette from '@/core/theme/palette';
import { useTileNotes } from '@/hooks/useTileNotes';
import type { CalendarEvent, NotesScope } from '@/core/common/types/schedule';

export interface EditNotesProps {
	event: CalendarEvent;
	onClose: () => void;
	scope?: NotesScope;
	/** Debounce window before auto-saving editor changes. */
	autoSaveDelayMs?: number;
}

type SaveStatus = 'idle' | 'dirty' | 'saving' | 'saved' | 'error';

/**
 * Full-side-panel rich text note editor for a calendar event / sub-event.
 *
 * - Toolbar with Notion-style formatting (headings, lists, checklists, link, code).
 * - Stores Markdown in the existing `UserNote` column so the Flutter app can
 *   continue to render/edit the same blob with `flutter_markdown`.
 * - Auto-saves with optimistic etag handling via `useTileNotes`.
 */
export const EditNotes: React.FC<EditNotesProps> = ({
	event,
	onClose,
	scope = 'auto',
	autoSaveDelayMs = 5000,
}) => {
	const { t } = useTranslation();
	const { payload, isLoading, isSaving, error, conflict, save, clearConflict } = useTileNotes(
		event.id ?? null,
		scope
	);

	const [status, setStatus] = useState<SaveStatus>('idle');
	const lastSavedMarkdownRef = useRef<string>('');
	const lastLoadedNoteRef = useRef<string | null>(null);
	const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const extensions = useMemo(
		() => [
			StarterKit.configure({
				heading: { levels: [1, 2, 3] },
				codeBlock: {},
			}),
			Underline,
			Link.configure({
				openOnClick: false,
				autolink: true,
				HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' },
			}),
			TaskList,
			TaskItem.configure({ nested: true }),
			Placeholder.configure({
				placeholder: t(
					'notesEditor.placeholder',
					'Start writing. Use the toolbar above to format, or type "/" style markdown shortcuts…'
				),
			}),
			Markdown.configure({
				html: false,
				transformPastedText: true,
				transformCopiedText: true,
				breaks: true,
				tightLists: true,
			}),
		],
		[t]
	);

	const flushSave = useCallback(
		async (markdown: string) => {
			if (markdown === lastSavedMarkdownRef.current) return;
			setStatus('saving');
			const result = await save(markdown);
			if (!result) {
				setStatus('error');
				return;
			}
			lastSavedMarkdownRef.current = result.UserNote ?? '';
			setStatus(result.concurrencyConflict ? 'error' : 'saved');
		},
		[save]
	);

	const editor = useEditor({
		extensions,
		content: '',
		editorProps: {
			attributes: {
				'data-testid': 'notes-editor-surface',
				class: 'tiler-notes-editor-surface',
				role: 'textbox',
				'aria-multiline': 'true',
				'aria-label': t('notesEditor.surfaceAria', 'Note editor'),
			},
		},
		onUpdate: ({ editor: ed }) => {
			setStatus('dirty');
			if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
			saveTimerRef.current = setTimeout(() => {
				const md = ed.storage.markdown?.getMarkdown?.() ?? ed.getText();
				void flushSave(md);
			}, autoSaveDelayMs);
		},
	});

	// Load server payload into the editor whenever the saved UserNote changes
	// from outside the editor (initial load, conflict-resolve, refresh).
	useEffect(() => {
		if (!editor) return;
		const note = payload?.UserNote ?? '';
		if (note === lastLoadedNoteRef.current) return;
		lastLoadedNoteRef.current = note;
		lastSavedMarkdownRef.current = note;
		editor.commands.setContent(note, false);
		setStatus('idle');
	}, [editor, payload?.UserNote]);

	// Flush pending edits on unmount.
	useEffect(() => {
		return () => {
			if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
			if (editor) {
				const md = editor.storage.markdown?.getMarkdown?.() ?? editor.getText();
				if (md !== lastSavedMarkdownRef.current) {
					void save(md);
				}
			}
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const handleSaveNow = useCallback(() => {
		if (!editor) return;
		if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
		const md = editor.storage.markdown?.getMarkdown?.() ?? editor.getText();
		void flushSave(md);
	}, [editor, flushSave]);

	return (
		<Root data-testid="edit-notes-panel">
			<Header>
				<IconButton
					type="button"
					onClick={onClose}
					aria-label={t('notesEditor.back', 'Back')}
				>
					<ArrowLeft size={18} />
				</IconButton>
				<TitleBlock>
					<Eyebrow>{t('notesEditor.eyebrow', 'Notes')}</Eyebrow>
					<Title title={event.name ?? ''}>{event.name}</Title>
				</TitleBlock>
				<SaveIndicator status={status} isSaving={isSaving} />
				<IconButton
					type="button"
					onClick={onClose}
					aria-label={t('notesEditor.close', 'Close')}
				>
					<X size={18} />
				</IconButton>
			</Header>

			{editor && <EditorToolbar editor={editor} onSaveNow={handleSaveNow} />}

			{isLoading ? (
				<Centered data-testid="edit-notes-loading">
					<Loader2 size={20} className="spin" />
					<span>{t('notesEditor.loading', 'Loading notes…')}</span>
				</Centered>
			) : error && !payload ? (
				<Centered data-testid="edit-notes-error" role="alert">
					<AlertTriangle size={18} />
					<span>
						{t('notesEditor.errorLoad', "Couldn't load notes.")} {error.message}
					</span>
				</Centered>
			) : (
				<EditorScroll>
					<EditorSurface>
						<EditorContent editor={editor} />
					</EditorSurface>
				</EditorScroll>
			)}

			{conflict && (
				<ConflictBanner data-testid="edit-notes-conflict" role="alert">
					<strong>
						{t('notesEditor.conflict.title', 'Someone else updated this note.')}
					</strong>
					<ConflictActions>
						<SecondaryButton
							type="button"
							onClick={() => {
								if (editor) {
									editor.commands.setContent(
										conflict.server.UserNote ?? '',
										false
									);
									lastSavedMarkdownRef.current = conflict.server.UserNote ?? '';
									lastLoadedNoteRef.current = conflict.server.UserNote ?? '';
								}
								clearConflict();
								setStatus('saved');
							}}
						>
							{t('notesEditor.conflict.discard', 'Discard mine')}
						</SecondaryButton>
						<SecondaryButton
							type="button"
							onClick={() => {
								clearConflict();
								setStatus('dirty');
							}}
						>
							{t('notesEditor.conflict.keep', 'Keep editing')}
						</SecondaryButton>
					</ConflictActions>
				</ConflictBanner>
			)}
		</Root>
	);
};

// ---- Save indicator ---------------------------------------------------------

const SaveIndicator: React.FC<{ status: SaveStatus; isSaving: boolean }> = ({
	status,
	isSaving,
}) => {
	const { t } = useTranslation();
	if (isSaving || status === 'saving') {
		return (
			<Status data-testid="notes-save-status" data-status="saving">
				<Loader2 size={14} className="spin" /> {t('notesEditor.saving', 'Saving…')}
			</Status>
		);
	}
	if (status === 'saved') {
		return (
			<Status data-testid="notes-save-status" data-status="saved">
				<CheckCircle2 size={14} /> {t('notesEditor.saved', 'Saved')}
			</Status>
		);
	}
	if (status === 'error') {
		return (
			<Status data-testid="notes-save-status" data-status="error">
				<AlertTriangle size={14} /> {t('notesEditor.errorSave', 'Not saved')}
			</Status>
		);
	}
	if (status === 'dirty') {
		return (
			<Status data-testid="notes-save-status" data-status="dirty">
				{t('notesEditor.unsaved', 'Editing…')}
			</Status>
		);
	}
	return <Status data-testid="notes-save-status" data-status="idle" />;
};

// ---- Toolbar ----------------------------------------------------------------

interface ToolbarProps {
	editor: Editor;
	onSaveNow: () => void;
}

const EditorToolbar: React.FC<ToolbarProps> = ({ editor, onSaveNow }) => {
	const { t } = useTranslation();

	const toggleLink = useCallback(() => {
		const previous = editor.getAttributes('link').href as string | undefined;
		const url = window.prompt(t('notesEditor.linkPrompt', 'URL'), previous ?? 'https://');
		if (url === null) return;
		if (url === '') {
			editor.chain().focus().extendMarkRange('link').unsetLink().run();
			return;
		}
		editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
	}, [editor, t]);

	return (
		<Toolbar data-testid="notes-editor-toolbar" role="toolbar">
			<ToolGroup>
				<ToolButton
					type="button"
					title={t('notesEditor.tool.bold', 'Bold')}
					aria-label={t('notesEditor.tool.bold', 'Bold')}
					$active={editor.isActive('bold')}
					onClick={() => editor.chain().focus().toggleBold().run()}
				>
					<Bold size={15} />
				</ToolButton>
				<ToolButton
					type="button"
					title={t('notesEditor.tool.italic', 'Italic')}
					aria-label={t('notesEditor.tool.italic', 'Italic')}
					$active={editor.isActive('italic')}
					onClick={() => editor.chain().focus().toggleItalic().run()}
				>
					<Italic size={15} />
				</ToolButton>
				<ToolButton
					type="button"
					title={t('notesEditor.tool.underline', 'Underline')}
					aria-label={t('notesEditor.tool.underline', 'Underline')}
					$active={editor.isActive('underline')}
					onClick={() => editor.chain().focus().toggleUnderline().run()}
				>
					<UnderlineIcon size={15} />
				</ToolButton>
				<ToolButton
					type="button"
					title={t('notesEditor.tool.strike', 'Strikethrough')}
					aria-label={t('notesEditor.tool.strike', 'Strikethrough')}
					$active={editor.isActive('strike')}
					onClick={() => editor.chain().focus().toggleStrike().run()}
				>
					<Strikethrough size={15} />
				</ToolButton>
				<ToolButton
					type="button"
					title={t('notesEditor.tool.code', 'Inline code')}
					aria-label={t('notesEditor.tool.code', 'Inline code')}
					$active={editor.isActive('code')}
					onClick={() => editor.chain().focus().toggleCode().run()}
				>
					<Code size={15} />
				</ToolButton>
			</ToolGroup>

			<ToolGroup>
				<ToolButton
					type="button"
					title={t('notesEditor.tool.h1', 'Heading 1')}
					aria-label={t('notesEditor.tool.h1', 'Heading 1')}
					$active={editor.isActive('heading', { level: 1 })}
					onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
				>
					<Heading1 size={15} />
				</ToolButton>
				<ToolButton
					type="button"
					title={t('notesEditor.tool.h2', 'Heading 2')}
					aria-label={t('notesEditor.tool.h2', 'Heading 2')}
					$active={editor.isActive('heading', { level: 2 })}
					onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
				>
					<Heading2 size={15} />
				</ToolButton>
				<ToolButton
					type="button"
					title={t('notesEditor.tool.h3', 'Heading 3')}
					aria-label={t('notesEditor.tool.h3', 'Heading 3')}
					$active={editor.isActive('heading', { level: 3 })}
					onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
				>
					<Heading3 size={15} />
				</ToolButton>
			</ToolGroup>

			<ToolGroup>
				<ToolButton
					type="button"
					title={t('notesEditor.tool.bullet', 'Bullet list')}
					aria-label={t('notesEditor.tool.bullet', 'Bullet list')}
					$active={editor.isActive('bulletList')}
					onClick={() => editor.chain().focus().toggleBulletList().run()}
				>
					<List size={15} />
				</ToolButton>
				<ToolButton
					type="button"
					title={t('notesEditor.tool.ordered', 'Numbered list')}
					aria-label={t('notesEditor.tool.ordered', 'Numbered list')}
					$active={editor.isActive('orderedList')}
					onClick={() => editor.chain().focus().toggleOrderedList().run()}
				>
					<ListOrdered size={15} />
				</ToolButton>
				<ToolButton
					type="button"
					title={t('notesEditor.tool.task', 'Checklist')}
					aria-label={t('notesEditor.tool.task', 'Checklist')}
					$active={editor.isActive('taskList')}
					onClick={() => editor.chain().focus().toggleTaskList().run()}
				>
					<ListChecks size={15} />
				</ToolButton>
				<ToolButton
					type="button"
					title={t('notesEditor.tool.quote', 'Quote')}
					aria-label={t('notesEditor.tool.quote', 'Quote')}
					$active={editor.isActive('blockquote')}
					onClick={() => editor.chain().focus().toggleBlockquote().run()}
				>
					<Quote size={15} />
				</ToolButton>
				<ToolButton
					type="button"
					title={t('notesEditor.tool.link', 'Link')}
					aria-label={t('notesEditor.tool.link', 'Link')}
					$active={editor.isActive('link')}
					onClick={toggleLink}
				>
					<LinkIcon size={15} />
				</ToolButton>
			</ToolGroup>

			<ToolGroup>
				<ToolButton
					type="button"
					title={t('notesEditor.tool.undo', 'Undo')}
					aria-label={t('notesEditor.tool.undo', 'Undo')}
					onClick={() => editor.chain().focus().undo().run()}
					disabled={!editor.can().undo()}
				>
					<Undo2 size={15} />
				</ToolButton>
				<ToolButton
					type="button"
					title={t('notesEditor.tool.redo', 'Redo')}
					aria-label={t('notesEditor.tool.redo', 'Redo')}
					onClick={() => editor.chain().focus().redo().run()}
					disabled={!editor.can().redo()}
				>
					<Redo2 size={15} />
				</ToolButton>
			</ToolGroup>

			<Spacer />

			<SaveNowButton
				type="button"
				onClick={onSaveNow}
				title={t('notesEditor.saveNow', 'Save now')}
			>
				{t('notesEditor.save', 'Save')}
			</SaveNowButton>
		</Toolbar>
	);
};

// ---- Styles -----------------------------------------------------------------

const Root = styled.section`
	display: flex;
	flex-direction: column;
	height: 100%;
	width: 100%;
	min-height: 0;
	background: ${({ theme }) => theme.colors?.background?.card ?? '#ffffff'};
	color: ${({ theme }) => theme.colors?.text?.primary ?? '#111'};
`;

const Header = styled.header`
	display: flex;
	align-items: center;
	gap: 8px;
	padding: 10px 12px;
	border-bottom: 1px solid rgba(0, 0, 0, 0.08);
	flex: 0 0 auto;
`;

const TitleBlock = styled.div`
	display: flex;
	flex-direction: column;
	min-width: 0;
	flex: 1;
`;

const Eyebrow = styled.span`
	font-size: 11px;
	text-transform: uppercase;
	letter-spacing: 0.06em;
	color: ${palette.colors.textGrey};
	font-weight: 600;
`;

const Title = styled.h2`
	margin: 0;
	font-size: 15px;
	font-weight: 600;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
`;

const IconButton = styled.button`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 32px;
	height: 32px;
	border-radius: 6px;
	border: none;
	background: transparent;
	cursor: pointer;
	color: inherit;

	&:hover {
		background: rgba(0, 0, 0, 0.06);
	}
`;

const Status = styled.span<{ 'data-status': SaveStatus }>`
	display: inline-flex;
	align-items: center;
	gap: 4px;
	font-size: 12px;
	min-width: 56px;
	color: ${({ 'data-status': s }) =>
		s === 'error' ? '#b91c1c' : s === 'saved' ? '#15803d' : palette.colors.textGrey};

	.spin {
		animation: notes-spin 1s linear infinite;
	}

	@keyframes notes-spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}
`;

const Toolbar = styled.div`
	display: flex;
	align-items: center;
	flex-wrap: wrap;
	gap: 6px;
	padding: 6px 8px;
	border-bottom: 1px solid rgba(0, 0, 0, 0.08);
	background: rgba(0, 0, 0, 0.02);
	flex: 0 0 auto;
`;

const ToolGroup = styled.div`
	display: inline-flex;
	align-items: center;
	gap: 2px;
	padding-right: 6px;
	border-right: 1px solid rgba(0, 0, 0, 0.08);

	&:last-of-type {
		border-right: none;
	}
`;

const Spacer = styled.div`
	flex: 1;
`;

const ToolButton = styled.button<{ $active?: boolean }>`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 28px;
	height: 28px;
	border-radius: 5px;
	border: none;
	background: ${({ $active }) => ($active ? 'rgba(0, 0, 0, 0.10)' : 'transparent')};
	color: inherit;
	cursor: pointer;

	&:hover:not(:disabled) {
		background: rgba(0, 0, 0, 0.07);
	}

	&:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}
`;

const SaveNowButton = styled.button`
	font: inherit;
	font-size: 12px;
	font-weight: 600;
	padding: 4px 10px;
	border-radius: 6px;
	border: 1px solid rgba(0, 0, 0, 0.12);
	background: ${palette.colors.primary};
	color: #fff;
	cursor: pointer;

	&:hover {
		filter: brightness(1.05);
	}
`;

const EditorScroll = styled.div`
	flex: 1 1 auto;
	min-height: 0;
	overflow: auto;
	padding: 16px 20px 32px;
`;

const EditorSurface = styled.div`
	max-width: 760px;
	margin: 0 auto;

	.tiler-notes-editor-surface {
		outline: none;
		min-height: 240px;
		font-size: 15px;
		line-height: 1.55;
	}

	.ProseMirror p.is-editor-empty:first-child::before {
		content: attr(data-placeholder);
		color: ${palette.colors.textGrey};
		pointer-events: none;
		float: left;
		height: 0;
	}

	h1 {
		font-size: 1.7em;
		margin: 0.6em 0 0.2em;
		font-weight: 700;
	}
	h2 {
		font-size: 1.35em;
		margin: 0.6em 0 0.2em;
		font-weight: 700;
	}
	h3 {
		font-size: 1.15em;
		margin: 0.6em 0 0.2em;
		font-weight: 600;
	}

	p {
		margin: 0.4em 0;
	}

	ul,
	ol {
		padding-left: 1.4em;
		margin: 0.4em 0;
	}

	ul[data-type='taskList'] {
		list-style: none;
		padding: 0;

		li {
			display: flex;
			gap: 6px;
			align-items: flex-start;
			margin: 2px 0;
		}

		li > label {
			margin-top: 4px;
		}

		input[type='checkbox'] {
			cursor: pointer;
		}
	}

	blockquote {
		border-left: 3px solid ${palette.colors.primary};
		margin: 0.6em 0;
		padding: 0.2em 0.8em;
		color: ${palette.colors.textGrey};
	}

	code {
		font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
		background: rgba(0, 0, 0, 0.06);
		padding: 1px 4px;
		border-radius: 4px;
		font-size: 0.92em;
	}

	pre {
		background: rgba(0, 0, 0, 0.85);
		color: #f5f5f5;
		padding: 12px;
		border-radius: 8px;
		overflow: auto;

		code {
			background: transparent;
			color: inherit;
			padding: 0;
		}
	}

	a {
		color: ${palette.colors.primary};
		text-decoration: underline;
	}
`;

const Centered = styled.div`
	flex: 1;
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 8px;
	color: ${palette.colors.textGrey};
	font-size: 14px;

	.spin {
		animation: notes-spin 1s linear infinite;
	}
`;

const ConflictBanner = styled.div`
	border-top: 1px solid #d97706;
	background: #fef3c7;
	color: #78350f;
	padding: 10px 12px;
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 12px;
	flex: 0 0 auto;
`;

const ConflictActions = styled.div`
	display: flex;
	gap: 8px;
`;

const SecondaryButton = styled.button`
	font: inherit;
	font-size: 12px;
	padding: 4px 10px;
	border-radius: 6px;
	border: 1px solid rgba(0, 0, 0, 0.2);
	background: rgba(255, 255, 255, 0.7);
	cursor: pointer;
`;

export default EditNotes;
