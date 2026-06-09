import { describe, it, expect, vi, beforeEach } from 'vitest';
import { I18nextProvider } from 'react-i18next';
import { ThemeProvider } from '@/core/theme/ThemeProvider';
import { fireEvent, render, screen, setupUser, waitFor } from '@/test/test-utils';
import i18n from '@/i18n/config';
import EditNotes from '../EditNotes';
import type { CalendarEvent, NotesPayload } from '@/core/common/types/schedule';
import type { NotesConflict, UseTileNotesResult } from '@/hooks/useTileNotes';

const { mockUseTileNotes } = vi.hoisted(() => ({
	mockUseTileNotes: vi.fn(),
}));

vi.mock('@/hooks/useTileNotes', () => ({
	useTileNotes: mockUseTileNotes,
	default: mockUseTileNotes,
}));

const mockEvent = {
	id: 'event-1',
	name: 'Write release notes',
} as CalendarEvent;

const createPayload = (userNote: string): NotesPayload => ({
	EventId: 'event-1',
	Scope: 'auto',
	UserNote: userNote,
	AgentNote: null,
	Source: 'user',
	AuthorUserId: 'user-1',
	AgentNoteUpdatedAt: null,
	Etag: 'etag-1',
});

const createConflict = (serverNote: string, localDraft = 'Local draft'): NotesConflict => ({
	server: createPayload(serverNote),
	localDraft,
});

const createHookResult = (
	userNote = '',
	overrides: Partial<UseTileNotesResult> = {}
): UseTileNotesResult => ({
	payload: createPayload(userNote),
	isLoading: false,
	isSaving: false,
	error: null,
	conflict: null,
	refresh: vi.fn(),
	save: vi.fn(async (nextNote: string) => createPayload(nextNote)),
	clearConflict: vi.fn(),
	...overrides,
});

const renderEditNotes = ({
	userNote = '',
	hookOverrides = {},
	onClose = vi.fn(),
	event = mockEvent,
}: {
	userNote?: string;
	hookOverrides?: Partial<UseTileNotesResult>;
	onClose?: () => void;
	event?: CalendarEvent;
} = {}) => {
	const hookResult = createHookResult(userNote, hookOverrides);
	mockUseTileNotes.mockReturnValue(hookResult);

	const view = render(
		<I18nextProvider i18n={i18n}>
			<ThemeProvider defaultTheme="light">
				<EditNotes event={event} onClose={onClose} />
			</ThemeProvider>
		</I18nextProvider>
	);

	return { ...view, hookResult, onClose };
};

const getGeneratedCss = () =>
	Array.from(document.querySelectorAll('style'))
		.map((style) => style.textContent ?? '')
		.join('\n')
		.replace(/\s+/g, '');

describe('EditNotes', () => {
	beforeEach(() => {
		mockUseTileNotes.mockReset();
	});

	it('loads notes for the event and renders the editor chrome', async () => {
		renderEditNotes({ userNote: 'Existing note' });

		expect(mockUseTileNotes).toHaveBeenCalledWith('event-1', 'auto');
		expect(screen.getByText('Notes')).toBeInTheDocument();
		expect(screen.getByTitle('Write release notes')).toBeInTheDocument();
		expect(screen.getByTestId('notes-editor-toolbar')).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Bold' })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Bullet list' })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Numbered list' })).toBeInTheDocument();

		const editor = await screen.findByTestId('notes-editor-surface');

		await waitFor(() => {
			expect(editor).toHaveTextContent('Existing note');
		});
	});

	it('calls onClose from the close button', async () => {
		const user = setupUser();
		const onClose = vi.fn();
		renderEditNotes({ onClose });

		await user.click(screen.getByRole('button', { name: 'Close' }));

		expect(onClose).toHaveBeenCalledOnce();
	});

	it('shows a loading state while notes are loading', () => {
		renderEditNotes({
			hookOverrides: {
				payload: null,
				isLoading: true,
			},
		});

		expect(screen.getByTestId('edit-notes-loading')).toHaveTextContent('Loading notes');
		expect(screen.queryByTestId('notes-editor-surface')).not.toBeInTheDocument();
	});

	it('shows an error state when notes cannot be loaded', () => {
		renderEditNotes({
			hookOverrides: {
				payload: null,
				error: new Error('Network failed'),
			},
		});

		expect(screen.getByRole('alert')).toHaveTextContent("Couldn't load notes. Network failed");
		expect(screen.queryByTestId('notes-editor-surface')).not.toBeInTheDocument();
	});

	it('shows the saving status from the notes hook', () => {
		renderEditNotes({
			hookOverrides: {
				isSaving: true,
			},
		});

		expect(screen.getByTestId('notes-save-status')).toHaveAttribute('data-status', 'saving');
		expect(screen.getByTestId('notes-save-status')).toHaveTextContent('Saving');
	});

	it('does not save when Save is clicked and the note is unchanged', async () => {
		const user = setupUser();
		const { hookResult } = renderEditNotes({ userNote: 'Already saved' });

		await waitFor(() => {
			expect(screen.getByTestId('notes-editor-surface')).toHaveTextContent('Already saved');
		});
		await user.click(screen.getByRole('button', { name: 'Save' }));

		expect(hookResult.save).not.toHaveBeenCalled();
	});

	it('opens note links in a new tab when clicked', async () => {
		const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
		renderEditNotes({ userNote: '[Tiler](https://tiler.app)' });

		const link = await screen.findByRole('link', { name: 'Tiler' });

		fireEvent.click(link, { button: 0 });

		expect(openSpy).toHaveBeenCalledWith('https://tiler.app/', '_blank');
	});

	it('loads the server note and clears the conflict when discarding local edits', async () => {
		const user = setupUser();
		const clearConflict = vi.fn();
		renderEditNotes({
			userNote: 'Local draft',
			hookOverrides: {
				conflict: createConflict('Server version'),
				clearConflict,
			},
		});

		expect(screen.getByTestId('edit-notes-conflict')).toHaveTextContent(
			'Someone else updated this note.'
		);

		await user.click(screen.getByRole('button', { name: 'Discard mine' }));

		await waitFor(() => {
			expect(screen.getByTestId('notes-editor-surface')).toHaveTextContent('Server version');
		});
		expect(clearConflict).toHaveBeenCalledOnce();
		expect(screen.getByTestId('notes-save-status')).toHaveAttribute('data-status', 'saved');
	});

	it('keeps the local draft and clears the conflict when continuing to edit', async () => {
		const user = setupUser();
		const clearConflict = vi.fn();
		renderEditNotes({
			userNote: 'Local draft',
			hookOverrides: {
				conflict: createConflict('Server version'),
				clearConflict,
			},
		});

		await user.click(screen.getByRole('button', { name: 'Keep editing' }));

		expect(clearConflict).toHaveBeenCalledOnce();
		expect(screen.getByTestId('notes-editor-surface')).toHaveTextContent('Local draft');
		expect(screen.getByTestId('notes-save-status')).toHaveAttribute('data-status', 'dirty');
		expect(screen.getByTestId('notes-save-status')).toHaveTextContent('Editing');
	});
});

describe('EditNotes list rendering', () => {
	beforeEach(() => {
		mockUseTileNotes.mockReset();
	});

	it('loads markdown bullet and numbered lists into the editor document', async () => {
		renderEditNotes({
			userNote: [
				'- First bullet',
				'- Second bullet',
				'',
				'1. First step',
				'2. Second step',
			].join('\n'),
		});

		const editor = await screen.findByTestId('notes-editor-surface');

		await waitFor(() => {
			expect(editor.querySelector('ul li')?.textContent).toBe('First bullet');
			expect(editor.querySelector('ol li')?.textContent).toBe('First step');
		});

		expect(
			Array.from(editor.querySelectorAll('ul li')).map((item) => item.textContent)
		).toEqual(['First bullet', 'Second bullet']);
		expect(
			Array.from(editor.querySelectorAll('ol li')).map((item) => item.textContent)
		).toEqual(['First step', 'Second step']);
	});

	it('restores bullet and numbered list markers inside the notes editor', async () => {
		renderEditNotes({ userNote: ['- Bullet', '', '1. Numbered'].join('\n') });

		await screen.findByTestId('notes-editor-surface');

		const css = getGeneratedCss();

		expect(css).toMatch(/ul:not\(\[data-type=(['"])taskList\1\]\)\{list-style-type:disc;\}/);
		expect(css).toContain('list-style-type:circle;');
		expect(css).toContain('list-style-type:square;');
		expect(css).toMatch(/ol\{list-style-type:decimal;\}/);
		expect(css).toContain('olol{list-style-type:lower-alpha;}');
		expect(css).toContain('ololol{list-style-type:lower-roman;}');
	});

	it('keeps checklist lists unmarked so they render as checkbox rows', async () => {
		renderEditNotes({ userNote: ['- [ ] Prep draft', '- [x] Review draft'].join('\n') });

		const editor = await screen.findByTestId('notes-editor-surface');

		await waitFor(() => {
			expect(editor.querySelector("ul[data-type='taskList']")).toBeInTheDocument();
			expect(editor.querySelectorAll("input[type='checkbox']")).toHaveLength(2);
		});

		const css = getGeneratedCss();

		expect(css).toContain("ul[data-type='taskList']{list-style:none;padding:0;");
	});
});
