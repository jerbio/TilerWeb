import { useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import { Bold, Italic, Heading2, List, ListOrdered, Link, Code, Quote } from 'lucide-react';
import Input from '@/core/common/components/input';
import TileShareNote from './TileShareNote';
import { tileShareReveal, tileShareInteraction } from './tileshareMotion';

/** A controlled Markdown source field: editing and previewing never replace it with HTML. */
export default function MarkdownNoteField({
	name,
	label,
	placeholder,
	value,
	onChange,
	disabled = false,
	rows = 4,
}: {
	name: string;
	label?: string;
	placeholder?: string;
	value: string;
	onChange: (value: string) => void;
	disabled?: boolean;
	rows?: number;
}) {
	const { t } = useTranslation();
	const id = useId();
	const root = useRef<HTMLDivElement>(null);
	const [preview, setPreview] = useState(false);
	const format = (before: string, after = '', line = false) => {
		if (disabled) return;
		const input = root.current?.querySelector('textarea');
		if (!input) return;
		let start = input.selectionStart;
		const end = input.selectionEnd;
		if (line) start = value.slice(0, start).lastIndexOf('\n') + 1;
		const selected = value.slice(start, end);
		const replacement = line
			? selected
					.split('\n')
					.map((text) => before + text)
					.join('\n')
			: before + selected + after;
		onChange(value.slice(0, start) + replacement + value.slice(end));
		requestAnimationFrame(() => {
			input.focus();
			input.setSelectionRange(
				start + before.length,
				start + replacement.length - after.length
			);
		});
	};
	return (
		<Root ref={root}>
			<ModeBar>
				<ModeButton
					type="button"
					disabled={disabled}
					aria-pressed={!preview}
					aria-controls={`${id}-content`}
					onClick={() => setPreview(false)}
				>
					{t('tileShareMarkdown.write', 'Write')}
				</ModeButton>
				<ModeButton
					type="button"
					disabled={disabled}
					aria-pressed={preview}
					aria-controls={`${id}-content`}
					onClick={() => setPreview(true)}
				>
					{t('tileShareMarkdown.preview', 'Preview')}
				</ModeButton>
			</ModeBar>
			{!preview && (
				<Tools
					role="group"
					aria-label={t('tileShareMarkdown.formatting', 'Note formatting')}
				>
					<Tool
						type="button"
						disabled={disabled}
						title={t('notesEditor.tool.bold', 'Bold')}
						aria-label={t('notesEditor.tool.bold', 'Bold')}
						onClick={() => format('**', '**')}
					>
						<Bold size={16} />
					</Tool>
					<Tool
						type="button"
						disabled={disabled}
						title={t('notesEditor.tool.italic', 'Italic')}
						aria-label={t('notesEditor.tool.italic', 'Italic')}
						onClick={() => format('*', '*')}
					>
						<Italic size={16} />
					</Tool>
					<Tool
						type="button"
						disabled={disabled}
						title={t('notesEditor.tool.h2', 'Heading 2')}
						aria-label={t('notesEditor.tool.h2', 'Heading 2')}
						onClick={() => format('## ', '', true)}
					>
						<Heading2 size={16} />
					</Tool>
					<Tool
						type="button"
						disabled={disabled}
						title={t('notesEditor.tool.bullet', 'Bullet list')}
						aria-label={t('notesEditor.tool.bullet', 'Bullet list')}
						onClick={() => format('- ', '', true)}
					>
						<List size={16} />
					</Tool>
					<Tool
						type="button"
						disabled={disabled}
						title={t('notesEditor.tool.ordered', 'Numbered list')}
						aria-label={t('notesEditor.tool.ordered', 'Numbered list')}
						onClick={() => format('1. ', '', true)}
					>
						<ListOrdered size={16} />
					</Tool>
					<Tool
						type="button"
						disabled={disabled}
						title={t('notesEditor.tool.link', 'Link')}
						aria-label={t('notesEditor.tool.link', 'Link')}
						onClick={() => format('[', '](https://)')}
					>
						<Link size={16} />
					</Tool>
					<Tool
						type="button"
						disabled={disabled}
						title={t('notesEditor.tool.code', 'Inline code')}
						aria-label={t('notesEditor.tool.code', 'Inline code')}
						onClick={() => format('`', '`')}
					>
						<Code size={16} />
					</Tool>
					<Tool
						type="button"
						disabled={disabled}
						title={t('notesEditor.tool.quote', 'Quote')}
						aria-label={t('notesEditor.tool.quote', 'Quote')}
						onClick={() => format('> ', '', true)}
					>
						<Quote size={16} />
					</Tool>
				</Tools>
			)}
			<div id={`${id}-content`}>
				{preview ? (
					<Preview
						role="region"
						aria-label={t('tileShareMarkdown.previewLabel', 'Note preview')}
					>
						{label && <PreviewLabel>{label}</PreviewLabel>}
						{value.trim() ? (
							<TileShareNote content={value} />
						) : (
							<Empty>{t('tileShareMarkdown.empty', 'Nothing to preview yet.')}</Empty>
						)}
					</Preview>
				) : (
					<Input.Textarea
						id={`${id}-input`}
						name={name}
						label={label}
						aria-label={
							label || placeholder || t('notesEditor.surfaceAria', 'Note editor')
						}
						aria-describedby={`${id}-hint`}
						placeholder={placeholder}
						value={value}
						onChange={(event) => onChange(event.target.value)}
						disabled={disabled}
						rows={rows}
					/>
				)}
			</div>
			<Hint id={`${id}-hint`}>
				{t(
					'tileShareMarkdown.hint',
					'Markdown supported: headings, bold, lists, links, and code.'
				)}
			</Hint>
		</Root>
	);
}

const Root = styled.div`
	min-width: 0;
	display: grid;
	gap: 8px;
`;
const ModeBar = styled.div`
	display: flex;
	gap: 4px;
	padding: 4px;
	width: fit-content;
	border: 1px solid ${({ theme }) => theme.colors.border.default};
	background: ${({ theme }) => theme.colors.input.bg};
	border-radius: 10px;
`;
const ModeButton = styled.button`
	${tileShareInteraction}
	padding: 6px 12px;
	border: 0;
	border-radius: 6px;
	color: ${({ theme }) => theme.colors.text.secondary};
	background: transparent;
	&[aria-pressed='true'] {
		color: ${({ theme }) => theme.colors.text.primary};
		background: ${({ theme }) => theme.colors.background.card};
	}
	&:focus-visible {
		outline: 2px solid ${({ theme }) => theme.colors.brand[500]};
		outline-offset: 2px;
	}
	&:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}
`;
const Tools = styled.div`
	display: flex;
	flex-wrap: wrap;
	gap: 4px;
	padding: 6px;
	border-radius: 10px;
	background: ${({ theme }) => theme.colors.input.bg};
`;
const Tool = styled.button`
	${tileShareInteraction}
	display: inline-flex;
	align-items: center;
	justify-content: center;
	padding: 6px;
	border-radius: 4px;
	color: ${({ theme }) => theme.colors.text.secondary};
	&:hover:not(:disabled) {
		background: ${({ theme }) => theme.colors.background.card};
		color: ${({ theme }) => theme.colors.text.primary};
	}
	&:focus-visible {
		outline: 2px solid ${({ theme }) => theme.colors.brand[500]};
		outline-offset: 2px;
	}
	&:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}
`;
const Preview = styled.div`
	${tileShareReveal}
	min-height: 120px;
	padding: 16px;
	border: 1px solid ${({ theme }) => theme.colors.input.border};
	border-radius: 8px;
	background: ${({ theme }) => theme.colors.input.bg};
	color: ${({ theme }) => theme.colors.input.text};
`;
const PreviewLabel = styled.p`
	font-size: 12px;
	margin-bottom: 8px;
	color: ${({ theme }) => theme.colors.text.secondary};
`;
const Empty = styled.p`
	color: ${({ theme }) => theme.colors.text.secondary};
`;
const Hint = styled.small`
	color: ${({ theme }) => theme.colors.text.secondary};
	font-size: 12px;
`;
