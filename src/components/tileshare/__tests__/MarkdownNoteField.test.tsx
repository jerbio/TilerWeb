import { useState } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@/test/test-utils';
import MarkdownNoteField from '../MarkdownNoteField';

vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));

function Field({
	initial = '',
	disabled = false,
	onChange = () => {},
}: {
	initial?: string;
	disabled?: boolean;
	onChange?: (value: string) => void;
}) {
	const [value, setValue] = useState(initial);
	return (
		<MarkdownNoteField
			name="note"
			label="Note"
			value={value}
			disabled={disabled}
			onChange={(next) => {
				setValue(next);
				onChange(next);
			}}
		/>
	);
}

describe('MarkdownNoteField', () => {
	it('previews Markdown and preserves the exact source when returning to Write', () => {
		const source =
			'## Plan\n\n**Launch** and *review*\n\n- First\n- Second\n\n[Docs](https://example.com)\n\n    code();\n';
		const onChange = vi.fn();
		render(<Field initial={source} onChange={onChange} />);
		fireEvent.click(screen.getByRole('button', { name: 'tileShareMarkdown.preview' }));
		const preview = within(
			screen.getByRole('region', { name: 'tileShareMarkdown.previewLabel' })
		);
		expect(preview.getByRole('heading', { name: 'Plan', level: 2 })).toBeInTheDocument();
		expect(preview.getByText('Launch').tagName).toBe('STRONG');
		expect(preview.getByText('review').tagName).toBe('EM');
		expect(preview.getAllByRole('listitem')).toHaveLength(2);
		expect(preview.getByRole('link', { name: 'Docs' })).toHaveAttribute(
			'href',
			'https://example.com'
		);
		expect(preview.getByText('code();').tagName).toBe('CODE');
		fireEvent.click(screen.getByRole('button', { name: 'tileShareMarkdown.write' }));
		expect(screen.getByLabelText('Note')).toHaveValue(source);
		expect(onChange).not.toHaveBeenCalled();
	});
	it('formats the selected text without altering the rest of the source', () => {
		const onChange = vi.fn();
		render(<Field initial="Hello world" onChange={onChange} />);
		const input = screen.getByLabelText('Note') as HTMLTextAreaElement;
		input.setSelectionRange(6, 11);
		fireEvent.click(screen.getByRole('button', { name: 'notesEditor.tool.bold' }));
		expect(onChange).toHaveBeenLastCalledWith('Hello **world**');
		expect(input).toHaveValue('Hello **world**');
	});
	it('applies list formatting to each selected line', () => {
		render(<Field initial={'First\nSecond'} />);
		const input = screen.getByLabelText('Note') as HTMLTextAreaElement;
		input.setSelectionRange(0, input.value.length);
		fireEvent.click(screen.getByRole('button', { name: 'notesEditor.tool.bullet' }));
		expect(input).toHaveValue('- First\n- Second');
	});
	it('keeps the source controlled when notes are replaced from outside', () => {
		const { rerender } = render(
			<MarkdownNoteField name="note" label="Note" value="**First**" onChange={vi.fn()} />
		);
		fireEvent.click(screen.getByRole('button', { name: 'tileShareMarkdown.preview' }));
		rerender(
			<MarkdownNoteField name="note" label="Note" value="## Updated" onChange={vi.fn()} />
		);
		expect(screen.getByRole('heading', { name: 'Updated', level: 2 })).toBeInTheDocument();
		fireEvent.click(screen.getByRole('button', { name: 'tileShareMarkdown.write' }));
		expect(screen.getByLabelText('Note')).toHaveValue('## Updated');
	});
	it('does not interpret HTML or executable links in a note preview', () => {
		const { container } = render(
			<Field initial={'<script>alert(1)</script>\n\n[Bad](javascript:alert(1))'} />
		);
		fireEvent.click(screen.getByRole('button', { name: 'tileShareMarkdown.preview' }));
		expect(container.querySelector('script')).toBeNull();
		expect(container.querySelector('a')?.getAttribute('href')).not.toMatch(/^javascript:/);
	});
	it('prevents note edits and formatting while saving', () => {
		const onChange = vi.fn();
		render(<Field disabled onChange={onChange} />);
		expect(screen.getByLabelText('Note')).toBeDisabled();
		for (const button of screen.getAllByRole('button')) expect(button).toBeDisabled();
		fireEvent.click(screen.getByRole('button', { name: 'notesEditor.tool.bold' }));
		expect(onChange).not.toHaveBeenCalled();
	});
});
