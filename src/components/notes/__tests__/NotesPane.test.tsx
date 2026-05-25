import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, setupUser, waitFor } from '@/test/test-utils';
import { ThemeProvider } from 'styled-components';
import { lightTheme } from '@/core/theme/light';
import { NotesPane } from '../NotesPane';
import type { NotesPayload } from '@/core/common/types/schedule';
import type { UseTileNotesResult } from '@/hooks/useTileNotes';

const mockSave = vi.fn();
const mockRefresh = vi.fn();
const mockClearConflict = vi.fn();

let hookValue: UseTileNotesResult = {
	payload: null,
	isLoading: true,
	isSaving: false,
	error: null,
	conflict: null,
	refresh: mockRefresh,
	save: mockSave,
	clearConflict: mockClearConflict,
};

vi.mock('@/hooks/useTileNotes', () => ({
	useTileNotes: () => hookValue,
}));

const basePayload = (overrides: Partial<NotesPayload> = {}): NotesPayload => ({
	EventId: 'evt_0_0_0',
	Scope: 'calendar',
	UserNote: 'My note',
	AgentNote: '## Agent says\n\nReschedule this.',
	Source: 'user',
	AuthorUserId: 'u-1',
	AgentNoteUpdatedAt: null,
	Etag: 'AAAAAAAAB9I=',
	...overrides,
});

const renderPane = () =>
	render(
		<ThemeProvider theme={lightTheme}>
			<NotesPane eventId="evt_0_0_0" />
		</ThemeProvider>
	);

describe('NotesPane', () => {
	beforeEach(() => {
		mockSave.mockReset();
		mockRefresh.mockReset();
		mockClearConflict.mockReset();
		hookValue = {
			payload: null,
			isLoading: true,
			isSaving: false,
			error: null,
			conflict: null,
			refresh: mockRefresh,
			save: mockSave,
			clearConflict: mockClearConflict,
		};
	});

	it('renders a loading state while the hook is loading', () => {
		renderPane();
		expect(screen.getByTestId('notes-pane-loading')).toBeInTheDocument();
	});

	it('renders the user note in the textarea and agent note as markdown', () => {
		hookValue = { ...hookValue, isLoading: false, payload: basePayload() };
		renderPane();

		const textarea = screen.getByLabelText(/your note/i) as HTMLTextAreaElement;
		expect(textarea.value).toBe('My note');

		// react-markdown renders the heading as <h2>
		expect(screen.getByRole('heading', { name: /agent says/i })).toBeInTheDocument();
		expect(screen.getByText(/reschedule this/i)).toBeInTheDocument();
	});

	it('disables the Save button when the textarea matches the saved note', () => {
		hookValue = { ...hookValue, isLoading: false, payload: basePayload() };
		renderPane();
		expect(screen.getByRole('button', { name: /save/i })).toBeDisabled();
	});

	it('enables Save once the user edits, and invokes hook.save with the new text', async () => {
		hookValue = { ...hookValue, isLoading: false, payload: basePayload() };
		mockSave.mockResolvedValue(basePayload({ UserNote: 'My note edited' }));
		const user = setupUser();

		renderPane();

		const textarea = screen.getByLabelText(/your note/i);
		await user.type(textarea, ' edited');

		const saveBtn = screen.getByRole('button', { name: /save/i });
		expect(saveBtn).toBeEnabled();

		await user.click(saveBtn);

		expect(mockSave).toHaveBeenCalledWith('My note edited');
	});

	it('shows the conflict banner when hook.conflict is populated', async () => {
		hookValue = {
			...hookValue,
			isLoading: false,
			payload: basePayload({ UserNote: 'server text' }),
			conflict: {
				server: basePayload({ UserNote: 'server text' }),
				localDraft: 'my local edits',
			},
		};

		renderPane();

		const banner = screen.getByTestId('notes-pane-conflict');
		expect(banner).toBeInTheDocument();
		expect(banner).toHaveTextContent(/my local edits/);
		expect(banner).toHaveTextContent(/server text/);
	});

	it('clicking "Discard my changes" dismisses the conflict and resets the editor', async () => {
		hookValue = {
			...hookValue,
			isLoading: false,
			payload: basePayload({ UserNote: 'server text' }),
			conflict: {
				server: basePayload({ UserNote: 'server text' }),
				localDraft: 'my local edits',
			},
		};
		const user = setupUser();

		renderPane();

		await user.click(screen.getByRole('button', { name: /discard my changes/i }));

		expect(mockClearConflict).toHaveBeenCalled();
	});

	it('shows an error state when hook.error is populated', () => {
		hookValue = {
			...hookValue,
			isLoading: false,
			error: new Error('boom'),
		};

		renderPane();

		expect(screen.getByTestId('notes-pane-error')).toBeInTheDocument();
	});

	it('does not render an agent section when AgentNote is empty', () => {
		hookValue = {
			...hookValue,
			isLoading: false,
			payload: basePayload({ AgentNote: null }),
		};
		renderPane();

		expect(screen.queryByTestId('notes-pane-agent')).not.toBeInTheDocument();
	});

	it('shows a saving indicator while save is in flight', async () => {
		hookValue = {
			...hookValue,
			isLoading: false,
			isSaving: true,
			payload: basePayload(),
		};
		renderPane();

		await waitFor(() => {
			expect(screen.getByRole('button', { name: /saving/i })).toBeDisabled();
		});
	});
});
