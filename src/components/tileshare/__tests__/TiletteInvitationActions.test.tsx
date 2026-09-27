import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, screen, waitFor, render as rtlRender } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { ThemeProvider } from 'styled-components';
import { darkTheme } from '@/core/theme/dark';
import { setupUser } from '@/test/test-utils';
const render = (ui: React.ReactElement) =>
	rtlRender(ui, {
		wrapper: ({ children }) => (
			<MemoryRouter>
				<ThemeProvider theme={darkTheme}>{children}</ThemeProvider>
			</MemoryRouter>
		),
	});
import { InvitationStatus, TileShareTemplate } from '@/core/common/types/tileshare';
import TiletteInvitationActions, {
	TiletteInvitationRefreshContext,
} from '../TiletteInvitationActions';
import TiletteRow from '../detail/body/TiletteRow';
import AssigneeTiletteCard from '../detail/body/AssigneeTiletteCard';

const mocks = vi.hoisted(() => ({
	user: { id: 'viewer' },
	respond: vi.fn(),
	read: vi.fn(),
	refresh: vi.fn(),
}));
vi.mock('@/core/auth/useAuth', () => ({ useAuth: () => ({ user: mocks.user }) }));
vi.mock('@/core/theme/ThemeProvider', () => ({ useTheme: () => ({ isDarkMode: true }) }));
vi.mock('@/api/tileshareApi', () => ({
	TileshareApi: class {
		respondToInvitation = mocks.respond;
		getInvitations = mocks.read;
	},
}));
vi.mock('react-i18next', () => ({
	useTranslation: () => ({ t: (key: string, fallback?: string) => fallback ?? key }),
}));
const tilette: TileShareTemplate = {
	id: 'tilette',
	name: 'UX Tiler',
	clusterId: 'cluster',
	creator: null,
	duration: null,
	start: null,
	end: null,
	miscData: null,
	designatedUsers: [
		{
			userId: 'other',
			designatedTileTemplateId: 'other-assignment',
			rsvpStatus: InvitationStatus.None,
			displayedIdentifier: 'Other',
			userProfile: null,
			completionPct: 0,
		},
		{
			userId: 'viewer',
			designatedTileTemplateId: 'mine',
			rsvpStatus: InvitationStatus.None,
			displayedIdentifier: 'Me',
			userProfile: null,
			completionPct: 0,
		},
	],
};
/** The fixture with every participant's assignment already resolved to `status`. */
const resolvedTilette = (status: string) => ({
	...tilette,
	designatedUsers: tilette.designatedUsers!.map((d) => ({ ...d, rsvpStatus: status })),
});

beforeEach(() => {
	vi.clearAllMocks();
	mocks.user = { id: 'viewer' };
	mocks.refresh.mockResolvedValue(undefined);
});

describe('inline tilette invitation actions', () => {
	it('accepts the signed-in participant assignment directly from its cluster row', async () => {
		const changed = vi.fn();
		window.addEventListener('tileshare-changed', changed);
		try {
			mocks.respond.mockResolvedValue({});
			render(
				<TiletteInvitationRefreshContext.Provider value={mocks.refresh}>
					<TiletteRow tilette={tilette} clusterId="cluster" />
				</TiletteInvitationRefreshContext.Provider>
			);
			expect(mocks.read).not.toHaveBeenCalled();
			await setupUser().click(screen.getByRole('button', { name: 'Accept' }));
			await waitFor(() => expect(mocks.refresh).toHaveBeenCalledOnce());
			expect(mocks.respond).toHaveBeenCalledExactlyOnceWith(
				'mine',
				InvitationStatus.Accepted
			);
			expect(changed).toHaveBeenCalledOnce();
			expect(screen.getByRole('status')).toHaveTextContent(
				'Accepted. Your tile has been created.'
			);
		} finally {
			window.removeEventListener('tileshare-changed', changed);
		}
	});
	it('shimmers the tilette row while the response is saving', async () => {
		let resolve!: () => void;
		mocks.respond.mockReturnValue(
			new Promise<void>((r) => {
				resolve = r;
			})
		);
		render(<TiletteRow tilette={tilette} clusterId="cluster" />);
		await setupUser().click(screen.getByRole('button', { name: 'Accept' }));
		expect(mocks.respond).toHaveBeenCalledOnce();
		expect(screen.getByTestId('tilette-shimmer')).toBeInTheDocument();
		expect(screen.getByRole('group', { name: 'Invitations: UX Tiler' })).toHaveAttribute(
			'aria-busy',
			'true'
		);
		await act(async () => resolve());
		await waitFor(() =>
			expect(screen.queryByTestId('tilette-shimmer')).not.toBeInTheDocument()
		);
	});
	it('declines from the current user lane without nesting buttons inside navigation links', async () => {
		mocks.respond.mockResolvedValue({});
		render(<AssigneeTiletteCard tilette={tilette} clusterId="cluster" assigneeId="viewer" />);
		const decline = screen.getByRole('button', { name: 'Decline' });
		expect(decline.closest('a')).toBeNull();
		await setupUser().click(decline);
		expect(mocks.respond).toHaveBeenCalledExactlyOnceWith('mine', InvitationStatus.Declined);
	});
	it('does not offer controls in another participant lane or for a resolved assignment', () => {
		const view = render(
			<AssigneeTiletteCard tilette={tilette} clusterId="cluster" assigneeId="other" />
		);
		expect(screen.queryByRole('button', { name: 'Accept' })).not.toBeInTheDocument();
		expect(screen.queryByRole('button', { name: 'Change response' })).not.toBeInTheDocument();
		view.rerender(
			<TiletteInvitationActions
				clusterId="cluster"
				tilette={resolvedTilette(InvitationStatus.Accepted)}
			/>
		);
		expect(screen.queryByRole('button', { name: 'Accept' })).not.toBeInTheDocument();
		expect(screen.queryByRole('button', { name: 'Decline' })).not.toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Change response' })).toBeInTheDocument();
		expect(screen.getByText('Current response: Accepted.')).toBeInTheDocument();
	});
	it('keeps the resolved response to the host badge without repeating a current-response row', () => {
		render(
			<AssigneeTiletteCard
				tilette={resolvedTilette(InvitationStatus.Accepted)}
				clusterId="cluster"
				assigneeId="viewer"
			/>
		);
		// The badge row already states the response, so the embedded actions only
		// expose the change toggle.
		expect(screen.getByRole('button', { name: 'Change response' })).toBeInTheDocument();
		expect(screen.queryByText('Current response: Accepted.')).not.toBeInTheDocument();
	});
	it('offers an icon-only edit toggle beside the row badge for a resolved response', () => {
		render(
			<TiletteRow tilette={resolvedTilette(InvitationStatus.Accepted)} clusterId="cluster" />
		);
		const edit = screen.getByRole('button', { name: 'Change response' });
		expect(edit.closest('a')).toBeNull();
		// The options stay collapsed until the toggle is opened.
		expect(screen.queryByRole('button', { name: 'Accept' })).not.toBeInTheDocument();
		expect(screen.queryByRole('button', { name: 'Cancel' })).not.toBeInTheDocument();
	});
	it('offers only the alternative option when the edit panel opens', async () => {
		render(
			<TiletteInvitationActions
				tilette={resolvedTilette(InvitationStatus.Declined)}
				clusterId="cluster"
			/>
		);
		expect(screen.queryByRole('button', { name: 'Accept' })).not.toBeInTheDocument();
		await setupUser().click(screen.getByRole('button', { name: 'Change response' }));
		// The already-selected option stays with the badge and is not repeated in the panel.
		expect(screen.queryByRole('button', { name: 'Decline' })).not.toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Accept' })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
	});
	it('collapses back to the badge and shows the update after a change is saved', async () => {
		const changed = vi.fn();
		window.addEventListener('tileshare-changed', changed);
		try {
			mocks.respond.mockResolvedValue({});
			render(
				<TiletteInvitationRefreshContext.Provider value={mocks.refresh}>
					<TiletteInvitationActions
						tilette={resolvedTilette(InvitationStatus.Declined)}
						clusterId="cluster"
					/>
				</TiletteInvitationRefreshContext.Provider>
			);
			await setupUser().click(screen.getByRole('button', { name: 'Change response' }));
			await setupUser().click(screen.getByRole('button', { name: 'Accept' }));
			// The panel collapses out of the accessibility tree while saving.
			expect(screen.queryByRole('button', { name: 'Accept' })).not.toBeInTheDocument();
			expect(screen.queryByRole('button', { name: 'Decline' })).not.toBeInTheDocument();
			expect(
				screen.queryByRole('button', { name: 'Change response' })
			).not.toBeInTheDocument();
			expect(mocks.respond).toHaveBeenCalledExactlyOnceWith(
				'mine',
				InvitationStatus.Accepted
			);
			await waitFor(() => expect(mocks.refresh).toHaveBeenCalledOnce());
			expect(changed).toHaveBeenCalledOnce();
			expect(screen.getByRole('status')).toHaveTextContent('Response updated to Accepted.');
		} finally {
			window.removeEventListener('tileshare-changed', changed);
		}
	});
	it('collapses the pending options while the first response is saving', async () => {
		let resolve!: () => void;
		mocks.respond.mockReturnValue(
			new Promise<void>((r) => {
				resolve = r;
			})
		);
		render(<TiletteInvitationActions tilette={tilette} clusterId="cluster" />);
		await setupUser().dblClick(screen.getByRole('button', { name: 'Accept' }));
		expect(mocks.respond).toHaveBeenCalledOnce();
		expect(screen.queryByRole('button', { name: 'Accept' })).not.toBeInTheDocument();
		expect(screen.queryByRole('button', { name: 'Decline' })).not.toBeInTheDocument();
		expect(screen.getByRole('status')).toHaveTextContent('Saving response...');
		expect(screen.getByRole('group', { name: 'Invitations: UX Tiler' })).toHaveAttribute(
			'aria-busy',
			'true'
		);
		await act(async () => resolve());
	});
	it('cancels a change back to the current response without an API call', async () => {
		render(
			<TiletteInvitationActions
				tilette={resolvedTilette(InvitationStatus.Accepted)}
				clusterId="cluster"
			/>
		);
		await setupUser().click(screen.getByRole('button', { name: 'Change response' }));
		// The accepted option stays with the badge; the panel offers the alternative.
		expect(screen.getByRole('button', { name: 'Decline' })).toBeInTheDocument();
		expect(screen.queryByRole('button', { name: 'Accept' })).not.toBeInTheDocument();
		await setupUser().click(screen.getByRole('button', { name: 'Cancel' }));
		expect(screen.queryByRole('button', { name: 'Accept' })).not.toBeInTheDocument();
		expect(screen.queryByRole('button', { name: 'Decline' })).not.toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Change response' })).toBeInTheDocument();
		expect(screen.getByText('Current response: Accepted.')).toBeInTheDocument();
		expect(mocks.respond).not.toHaveBeenCalled();
	});
	it('requires a status refresh after an uncertain response rather than resending it', async () => {
		mocks.respond.mockRejectedValue(new Error('timeout'));
		mocks.read.mockResolvedValue({ invitations: [], nextCursor: null });
		render(<TiletteInvitationActions tilette={tilette} clusterId="cluster" />);
		await setupUser().click(screen.getByRole('button', { name: 'Accept' }));
		await screen.findByRole('alert');
		expect(screen.queryByRole('button', { name: 'Accept' })).not.toBeInTheDocument();
		await setupUser().click(screen.getByRole('button', { name: 'Refresh' }));
		expect(mocks.read).toHaveBeenCalledExactlyOnceWith({
			ClusterId: 'cluster',
			TiletteId: 'tilette',
			AssignmentId: 'mine',
		});
		expect(mocks.respond).toHaveBeenCalledOnce();
		await screen.findByText('This invitation is no longer pending.');
	});
	it('changes an accepted response to declined through the change-response flow', async () => {
		mocks.respond.mockResolvedValue({});
		render(
			<TiletteInvitationActions
				tilette={resolvedTilette(InvitationStatus.Accepted)}
				clusterId="cluster"
			/>
		);
		await setupUser().click(screen.getByRole('button', { name: 'Change response' }));
		await setupUser().click(screen.getByRole('button', { name: 'Decline' }));
		expect(mocks.respond).toHaveBeenCalledExactlyOnceWith('mine', InvitationStatus.Declined);
		await screen.findByText('Response updated to Declined.');
	});
	it('dismisses the update toast after five seconds and restores the change toggle', async () => {
		vi.useFakeTimers({ shouldAdvanceTime: true });
		try {
			mocks.respond.mockResolvedValue({});
			const user = setupUser({ advanceTimers: vi.advanceTimersByTime });
			render(
				<TiletteInvitationActions
					tilette={resolvedTilette(InvitationStatus.Accepted)}
					clusterId="cluster"
				/>
			);
			await user.click(screen.getByRole('button', { name: 'Change response' }));
			await user.click(screen.getByRole('button', { name: 'Decline' }));
			// Flush the mocked API promise and the refresh microtask.
			await act(async () => {
				for (let i = 0; i < 10; i += 1) await Promise.resolve();
			});
			expect(screen.getByText('Response updated to Declined.')).toBeInTheDocument();
			await act(async () => {
				await vi.advanceTimersByTimeAsync(5000);
			});
			expect(screen.queryByText('Response updated to Declined.')).not.toBeInTheDocument();
			expect(screen.getByRole('button', { name: 'Change response' })).toBeInTheDocument();
		} finally {
			vi.useRealTimers();
		}
	});
	it('treats an uncertain change as applied once the pending list is empty', async () => {
		mocks.respond.mockRejectedValue(new Error('timeout'));
		mocks.read.mockResolvedValue({ invitations: [], nextCursor: null });
		render(
			<TiletteInvitationActions
				tilette={resolvedTilette(InvitationStatus.Declined)}
				clusterId="cluster"
			/>
		);
		await setupUser().click(screen.getByRole('button', { name: 'Change response' }));
		await setupUser().click(screen.getByRole('button', { name: 'Accept' }));
		await screen.findByRole('alert');
		await setupUser().click(screen.getByRole('button', { name: 'Refresh' }));
		expect(mocks.respond).toHaveBeenCalledOnce();
		expect(mocks.read).toHaveBeenCalledOnce();
		await screen.findByText('Response updated to Accepted.');
	});
	it('ignores a late response after changing accounts', async () => {
		let resolve!: () => void;
		mocks.respond.mockReturnValue(
			new Promise<void>((r) => {
				resolve = r;
			})
		);
		const view = render(
			<TiletteInvitationRefreshContext.Provider value={mocks.refresh}>
				<TiletteInvitationActions tilette={tilette} clusterId="cluster" />
			</TiletteInvitationRefreshContext.Provider>
		);
		await setupUser().click(screen.getByRole('button', { name: 'Accept' }));
		mocks.user = { id: 'stranger' };
		view.rerender(
			<TiletteInvitationRefreshContext.Provider value={mocks.refresh}>
				<TiletteInvitationActions tilette={tilette} clusterId="cluster" />
			</TiletteInvitationRefreshContext.Provider>
		);
		await act(async () => resolve());
		expect(mocks.refresh).not.toHaveBeenCalled();
		expect(screen.queryByRole('status')).not.toBeInTheDocument();
	});
});
