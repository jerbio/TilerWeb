import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@/test/test-utils';
import TiletteNotes from '../TiletteNotes';
import { tileShareNotesService } from '@/services/tileShareNotesService';
import type { NotesPayload } from '@/core/common/types/schedule';

vi.mock('react-i18next', async (importOriginal) => ({
	...(await importOriginal<typeof import('react-i18next')>()),
	useTranslation: () => ({ t: (key: string) => key }),
}));
vi.mock('@/services/tileShareNotesService', () => ({
	tileShareNotesService: { getNotes: vi.fn(), updateNotes: vi.fn() },
}));
const payload = (changes: Partial<NotesPayload> = {}): NotesPayload => ({
	EventId: 'task',
	Scope: 'tilette',
	UserNote: '**Saved note**',
	Etag: 'first',
	AgentNote: null,
	Source: null,
	AuthorUserId: null,
	AgentNoteUpdatedAt: null,
	...changes,
});

describe('TiletteNotes', () => {
	beforeEach(() => {
		vi.mocked(tileShareNotesService.getNotes).mockReset().mockResolvedValue(payload());
		vi.mocked(tileShareNotesService.updateNotes)
			.mockReset()
			.mockResolvedValue(payload({ UserNote: 'Updated', Etag: 'next' }));
	});
	it('retrieves and renders Markdown notes independently of the detail payload', async () => {
		render(<TiletteNotes id="task" canEdit={false} />);
		expect((await screen.findByText('Saved note')).tagName).toBe('STRONG');
		expect(tileShareNotesService.getNotes).toHaveBeenCalledWith('task', 'auto');
		expect(
			screen.queryByRole('button', { name: 'tileShareNotes.edit' })
		).not.toBeInTheDocument();
	});
	it('loads collapsed notes and lets the owner edit without expanding the summary', async () => {
		const { container } = render(<TiletteNotes id="task" canEdit compact />);
		const edit = await screen.findByRole('button', { name: 'tileShareNotes.edit' });
		expect(container.querySelector('details')).not.toHaveAttribute('open');
		fireEvent.click(edit);
		expect(screen.getByRole('dialog')).toBeInTheDocument();
		expect(screen.getByRole('textbox')).toHaveValue('**Saved note**');
		expect(container.querySelector('details')).not.toHaveAttribute('open');
		expect(tileShareNotesService.updateNotes).not.toHaveBeenCalled();
	});
	it('distinguishes an unavailable note from an empty note and allows retry', async () => {
		vi.mocked(tileShareNotesService.getNotes).mockRejectedValueOnce(new Error('offline'));
		render(<TiletteNotes id="task" canEdit />);
		expect(await screen.findByRole('alert')).toHaveTextContent('tileShareNotes.loadError');
		expect(screen.queryByText('tileShareNotes.empty')).not.toBeInTheDocument();
		fireEvent.click(screen.getByRole('button', { name: 'tileshareList.retry' }));
		expect(await screen.findByText('Saved note')).toBeInTheDocument();
	});
	it('saves with the read Etag and refreshes the displayed Markdown', async () => {
		render(<TiletteNotes id="task" canEdit />);
		fireEvent.click(await screen.findByRole('button', { name: 'tileShareNotes.edit' }));
		fireEvent.change(screen.getByRole('textbox'), { target: { value: '    code();\n' } });
		fireEvent.click(screen.getByRole('button', { name: 'tilesharedemo.detail.edit.save' }));
		await waitFor(() =>
			expect(tileShareNotesService.updateNotes).toHaveBeenCalledWith({
				EventID: 'task',
				Scope: 'auto',
				UserNote: '    code();\n',
				Etag: 'first',
			})
		);
		expect(await screen.findByText('Updated')).toBeInTheDocument();
		expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
	});
	it('preserves a conflicting draft, then uses the latest token only after the user keeps editing', async () => {
		vi.mocked(tileShareNotesService.updateNotes).mockResolvedValueOnce(
			payload({ UserNote: 'Other change', Etag: 'fresh', concurrencyConflict: true })
		);
		render(<TiletteNotes id="task" canEdit />);
		fireEvent.click(await screen.findByRole('button', { name: 'tileShareNotes.edit' }));
		fireEvent.change(screen.getByRole('textbox'), { target: { value: 'My draft' } });
		fireEvent.click(screen.getByRole('button', { name: 'tilesharedemo.detail.edit.save' }));
		expect(await screen.findByRole('alert')).toHaveTextContent('notesEditor.conflict.title');
		expect(screen.getByRole('textbox')).toHaveValue('My draft');
		expect(
			screen.getByRole('button', { name: 'tilesharedemo.detail.edit.save' })
		).toBeDisabled();
		fireEvent.click(screen.getByRole('button', { name: 'notesEditor.conflict.keep' }));
		fireEvent.click(screen.getByRole('button', { name: 'tilesharedemo.detail.edit.save' }));
		await waitFor(() =>
			expect(tileShareNotesService.updateNotes).toHaveBeenLastCalledWith(
				expect.objectContaining({ UserNote: 'My draft', Etag: 'fresh' })
			)
		);
	});
	it('retains edits when saving fails', async () => {
		vi.mocked(tileShareNotesService.updateNotes).mockRejectedValueOnce(new Error('offline'));
		render(<TiletteNotes id="task" canEdit />);
		fireEvent.click(await screen.findByRole('button', { name: 'tileShareNotes.edit' }));
		fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Keep this' } });
		fireEvent.click(screen.getByRole('button', { name: 'tilesharedemo.detail.edit.save' }));
		expect(await screen.findByRole('alert')).toHaveTextContent('tileShareNotes.saveError');
		expect(screen.getByRole('textbox')).toHaveValue('Keep this');
		fireEvent.click(screen.getByRole('button', { name: 'tilesharedemo.detail.edit.cancel' }));
		const dialogs = screen.getAllByRole('dialog');
		expect(dialogs).toHaveLength(2);
		fireEvent.click(
			within(dialogs[1]).getByRole('button', { name: 'tileShareComposer.keepEditing' })
		);
		expect(screen.getByRole('textbox')).toHaveValue('Keep this');
	});
});
