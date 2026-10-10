import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@/test/test-utils';
import { setupUser } from '@/test/test-utils';
import { flushSync } from 'react-dom';
import { Routes } from '@/core/constants/routes';
import type { DesignatedUser, TileShareTemplate } from '@/core/common/types/tileshare';
import { InvitationStatus } from '@/core/common/types/tileshare';
import { BOARD_DRAG_TYPE } from '../StatusBoardDrag';
import StatusBoardView from '../StatusBoardView';
import { TiletteInvitationRefreshContext } from '@/components/tileshare/TiletteInvitationActions';

const mocks = vi.hoisted(() => ({
	user: { id: 'u1' },
	respond: vi.fn(),
	refresh: vi.fn(),
}));

vi.mock('@/api/tileshareApi', () => ({
	TileshareApi: class {
		respondToInvitation = mocks.respond;
	},
}));
vi.mock('@/components/tileshare/TiletteInvitationActions', async () => {
	const { createContext } = await import('react');
	return {
		default: () => null,
		TiletteInvitationRefreshContext: createContext<(() => Promise<void>) | undefined>(
			undefined
		),
	};
});
vi.mock('@/core/auth/useAuth', () => ({ useAuth: () => ({ user: mocks.user }) }));

vi.mock('react-i18next', () => ({
	useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('@/core/theme/ThemeProvider', () => ({
	useTheme: () => ({ isDarkMode: true, toggleTheme: vi.fn() }),
}));

vi.mock('react-router', async () => {
	const actual = await vi.importActual<typeof import('react-router')>('react-router');
	return {
		...actual,
		useNavigate: () => vi.fn(),
		Link: ({ children, to, ...rest }: { children: React.ReactNode; to: string }) => (
			<a href={to} {...rest}>
				{children}
			</a>
		),
	};
});

function tilette(id: string, users: DesignatedUser[] | null = []): TileShareTemplate {
	return {
		id,
		name: id,
		creator: null,
		designatedUsers: users,
		clusterId: 'c',
		duration: null,
		start: null,
		end: null,
		miscData: null,
	};
}

function assignee(
	rsvpStatus: string | null,
	completionPct: number | null,
	userId = 'u1',
	designatedTileTemplateId: string | null = 'mine'
): DesignatedUser {
	return {
		displayedIdentifier: null,
		userId,
		designatedTileTemplateId,
		userProfile: null,
		rsvpStatus,
		completionPct,
	};
}

/** The board column that shows the given lane status label. */
function columnOf(statusKey: string): HTMLElement {
	const label = screen.getByText(statusKey);
	// label (span) -> status wrap (span) -> column header (div) -> column (div)
	return label.parentElement!.parentElement!.parentElement!;
}

/** The card wrapper hosting the given tilette name (draggable when enabled). */
function cardOf(name: string): HTMLElement {
	const nameEl = screen.getByText(name);
	// name (p) -> card link (a) -> card (div)
	return nameEl.parentElement!.parentElement!;
}

beforeEach(() => {
	vi.clearAllMocks();
	mocks.user = { id: 'u1' };
	mocks.respond.mockResolvedValue(undefined);
	mocks.refresh.mockResolvedValue(undefined);
});

describe('StatusBoardView', () => {
	it('renders the Todo, In progress and Completed columns', () => {
		render(<StatusBoardView tilettes={[tilette('t1')]} clusterId="c" />);
		expect(screen.getByText('tilesharedemo.detail.status.todo')).toBeInTheDocument();
		expect(screen.getByText('tilesharedemo.detail.status.inProgress')).toBeInTheDocument();
		expect(screen.getByText('tilesharedemo.detail.status.completed')).toBeInTheDocument();
	});

	it('places every tilette in the In progress lane while the status is stubbed', () => {
		render(<StatusBoardView tilettes={[tilette('t1'), tilette('t2')]} clusterId="c" />);
		expect(screen.getByText('t1')).toBeInTheDocument();
		expect(screen.getByText('t2')).toBeInTheDocument();
	});

	it('shows the empty state in the Todo and Completed lanes when no tilette is there', () => {
		render(<StatusBoardView tilettes={[tilette('t1')]} clusterId="c" />);
		const emptyStates = screen.getAllByText('tilesharedemo.detail.board.empty');
		expect(emptyStates).toHaveLength(2);
	});

	it('places an unaccepted tilette in the Todo lane even at 100% completion', () => {
		render(
			<StatusBoardView
				tilettes={[tilette('t1', [assignee(InvitationStatus.None, 100)]), tilette('t2')]}
				clusterId="c"
			/>
		);
		expect(screen.getByText('t1')).toBeInTheDocument();
		expect(screen.getByText('t2')).toBeInTheDocument();
		// Only the Completed lane is empty.
		expect(screen.getAllByText('tilesharedemo.detail.board.empty')).toHaveLength(1);
	});

	it('places a tilette whose assignees accepted and hit 100% in the Completed lane', () => {
		render(
			<StatusBoardView
				tilettes={[tilette('t1', [assignee(InvitationStatus.Accepted, 100)])]}
				clusterId="c"
			/>
		);
		expect(screen.getByText('t1')).toBeInTheDocument();
		// Todo and In progress lanes are empty.
		expect(screen.getAllByText('tilesharedemo.detail.board.empty')).toHaveLength(2);
	});

	it('offers the empty In progress lane as a visible drop target while a drag hovers it', () => {
		render(
			<StatusBoardView
				tilettes={[tilette('t1', [assignee(InvitationStatus.None, 0)])]}
				clusterId="c"
			/>
		);
		// t1 sits in Todo; In progress and Completed lanes are both empty.
		expect(screen.getAllByText('tilesharedemo.detail.board.empty')).toHaveLength(2);
		expect(screen.queryByTestId('board-drop-silhouette')).not.toBeInTheDocument();
		const lane = columnOf('tilesharedemo.detail.status.inProgress');
		fireEvent.dragEnter(lane);
		expect(screen.getByText('tilesharedemo.detail.board.dropHint')).toBeInTheDocument();
		// The hovered empty lane swaps its empty state for the drop hint.
		expect(screen.getAllByText('tilesharedemo.detail.board.empty')).toHaveLength(1);
		// ...and shows a card silhouette marking where the tilette will land.
		expect(screen.getByTestId('board-drop-silhouette')).toBeInTheDocument();
		fireEvent.dragLeave(lane);
		expect(screen.queryByText('tilesharedemo.detail.board.dropHint')).not.toBeInTheDocument();
		expect(screen.queryByTestId('board-drop-silhouette')).not.toBeInTheDocument();
		expect(screen.getAllByText('tilesharedemo.detail.board.empty')).toHaveLength(2);
	});

	it('shows a card silhouette at the top of a non-empty In progress lane while a drag hovers it', () => {
		render(
			<StatusBoardView
				tilettes={[
					tilette('t1', [assignee(InvitationStatus.Accepted, 40)]),
					tilette('t2', [assignee(InvitationStatus.None, 0)]),
				]}
				clusterId="c"
			/>
		);
		expect(screen.queryByTestId('board-drop-silhouette')).not.toBeInTheDocument();
		const lane = columnOf('tilesharedemo.detail.status.inProgress');
		fireEvent.dragEnter(lane);
		expect(screen.getByTestId('board-drop-silhouette')).toBeInTheDocument();
		fireEvent.dragLeave(lane);
		expect(screen.queryByTestId('board-drop-silhouette')).not.toBeInTheDocument();
	});

	it('keeps the silhouette when the pointer moves onto a child inside the lane', () => {
		render(
			<StatusBoardView
				tilettes={[
					tilette('t1', [assignee(InvitationStatus.Accepted, 40)]),
					tilette('t2', [assignee(InvitationStatus.None, 0)]),
				]}
				clusterId="c"
			/>
		);
		const lane = columnOf('tilesharedemo.detail.status.inProgress');
		fireEvent.dragEnter(lane);
		expect(screen.getByTestId('board-drop-silhouette')).toBeInTheDocument();
		// Moving the pointer onto a child card inside the lane fires a dragleave
		// (leaving the column) followed by a dragenter (entering the child). The
		// depth counter must keep the silhouette on — no flicker mid-drag.
		const child = lane.querySelector('div')!;
		fireEvent.dragLeave(lane);
		fireEvent.dragEnter(child);
		expect(screen.getByTestId('board-drop-silhouette')).toBeInTheDocument();
		// Fully leaving the lane (dragleave with no matching enter) clears it.
		fireEvent.dragLeave(lane);
		expect(screen.queryByTestId('board-drop-silhouette')).not.toBeInTheDocument();
	});

	it('links each tilette card to its detail page', () => {
		render(<StatusBoardView tilettes={[tilette('tpl-1')]} clusterId="c" />);
		const link = screen.getByRole('link', { name: 'tilesharedemo.detail.openTiletteAria' });
		expect(link).toHaveAttribute('href', Routes.Tileshare.tilette('c', 'tpl-1'));
	});

	it('renders the All / Just me filter tabs, defaulting to All', () => {
		render(<StatusBoardView tilettes={[]} clusterId="c" />);
		expect(
			screen.getByRole('tab', { name: 'tilesharedemo.detail.board.filter.all' })
		).toHaveAttribute('aria-selected', 'true');
		expect(
			screen.getByRole('tab', { name: 'tilesharedemo.detail.board.filter.mine' })
		).toHaveAttribute('aria-selected', 'false');
	});

	it("shows only the viewer's tilettes in Just me mode", async () => {
		const user = setupUser();
		render(
			<StatusBoardView
				tilettes={[
					tilette('t1', [assignee(InvitationStatus.None, 0)]),
					tilette('t2', [assignee(InvitationStatus.None, 0, 'other')]),
				]}
				clusterId="c"
			/>
		);
		expect(screen.getByText('t1')).toBeInTheDocument();
		expect(screen.getByText('t2')).toBeInTheDocument();
		await user.click(
			screen.getByRole('tab', { name: 'tilesharedemo.detail.board.filter.mine' })
		);
		expect(screen.getByText('t1')).toBeInTheDocument();
		expect(screen.queryByText('t2')).not.toBeInTheDocument();
	});

	it("derives the Just me lanes from the viewer's own RSVP and completion", async () => {
		const user = setupUser();
		render(
			<StatusBoardView
				tilettes={[
					tilette('todo-1', [assignee(InvitationStatus.Tentative, 100)]),
					tilette('progress-1', [assignee(InvitationStatus.Accepted, 40)]),
					tilette('done-1', [assignee(InvitationStatus.Accepted, 100)]),
					tilette('hidden-1', [assignee(InvitationStatus.Accepted, 100, 'other')]),
				]}
				clusterId="c"
			/>
		);
		await user.click(
			screen.getByRole('tab', { name: 'tilesharedemo.detail.board.filter.mine' })
		);
		// Tentative still counts as an open invitation even at 100%.
		expect(columnOf('tilesharedemo.detail.status.todo')).toHaveTextContent('todo-1');
		expect(columnOf('tilesharedemo.detail.status.inProgress')).toHaveTextContent('progress-1');
		expect(columnOf('tilesharedemo.detail.status.completed')).toHaveTextContent('done-1');
		expect(screen.queryByText('hidden-1')).not.toBeInTheDocument();
	});

	it("marks only the viewer's open Todo invitation as draggable", () => {
		render(
			<StatusBoardView
				tilettes={[
					tilette('t1', [assignee(InvitationStatus.None, 0)]),
					tilette('t2', [assignee(InvitationStatus.Tentative, 0)]),
					tilette('t3', [assignee(InvitationStatus.Accepted, 40)]),
					tilette('t4', [assignee(InvitationStatus.None, 0, 'other')]),
				]}
				clusterId="c"
			/>
		);
		expect(cardOf('t1')).toHaveAttribute('draggable', 'true');
		expect(cardOf('t2')).toHaveAttribute('draggable', 'true');
		// Already accepted: not re-acceptable by drag.
		expect(cardOf('t3')).not.toHaveAttribute('draggable', 'true');
		// Not the viewer's invitation.
		expect(cardOf('t4')).not.toHaveAttribute('draggable', 'true');
	});

	it('keeps the card link non-draggable so a drag started on the name uses the card as source', () => {
		render(
			<StatusBoardView
				tilettes={[tilette('t1', [assignee(InvitationStatus.None, 0)])]}
				clusterId="c"
			/>
		);
		// An <a href> is natively draggable; without this, starting a drag on the
		// name would begin a URL drag (no board payload, no-drop cursor).
		const link = cardOf('t1').querySelector('a')!;
		expect(link).not.toHaveAttribute('draggable', 'true');
		expect(link).toHaveAttribute('draggable', 'false');
	});

	it('carries the tilette id in the drag payload', () => {
		render(
			<StatusBoardView
				tilettes={[tilette('t1', [assignee(InvitationStatus.None, 0)])]}
				clusterId="c"
			/>
		);
		const setData = vi.fn();
		fireEvent.dragStart(cardOf('t1'), { dataTransfer: { setData, effectAllowed: '' } });
		expect(setData).toHaveBeenCalledWith(BOARD_DRAG_TYPE, 't1');
	});

	it('silently accepts the invitation when a Todo tilette is dropped on In progress', async () => {
		const changed = vi.fn();
		window.addEventListener('tileshare-changed', changed);
		try {
			render(
				<TiletteInvitationRefreshContext.Provider value={mocks.refresh}>
					<StatusBoardView
						tilettes={[tilette('t1', [assignee(InvitationStatus.None, 0)])]}
						clusterId="c"
					/>
				</TiletteInvitationRefreshContext.Provider>
			);
			fireEvent.drop(columnOf('tilesharedemo.detail.status.inProgress'), {
				dataTransfer: { getData: () => 't1' },
			});
			await waitFor(() =>
				expect(mocks.respond).toHaveBeenCalledExactlyOnceWith(
					'mine',
					InvitationStatus.Accepted
				)
			);
			await waitFor(() => expect(mocks.refresh).toHaveBeenCalledOnce());
			expect(changed).toHaveBeenCalledOnce();
		} finally {
			window.removeEventListener('tileshare-changed', changed);
		}
	});

	it('shows a transient accepting indicator on the dropped card while the request is in flight', async () => {
		let resolveRefresh: () => void = () => {};
		mocks.refresh.mockImplementation(
			() =>
				new Promise<void>((resolve) => {
					resolveRefresh = resolve;
				})
		);
		render(
			<TiletteInvitationRefreshContext.Provider value={mocks.refresh}>
				<StatusBoardView
					tilettes={[tilette('t1', [assignee(InvitationStatus.None, 0)])]}
					clusterId="c"
				/>
			</TiletteInvitationRefreshContext.Provider>
		);
		fireEvent.drop(columnOf('tilesharedemo.detail.status.inProgress'), {
			dataTransfer: { getData: () => 't1' },
		});
		// Let the handler advance to awaiting the (still pending) refresh.
		await waitFor(() => expect(mocks.refresh).toHaveBeenCalledTimes(1));
		expect(mocks.respond).toHaveBeenCalledTimes(1);
		const indicator = screen.getByTestId('board-accepting');
		expect(indicator).toHaveTextContent('tilesharedemo.detail.board.accepting');
		expect(screen.getByTestId('board-accepting-shimmer')).toBeInTheDocument();
		// Resolving the refresh ends the busy window and clears the indicator.
		resolveRefresh();
		await waitFor(() =>
			expect(screen.queryByTestId('board-accepting')).not.toBeInTheDocument()
		);
	});

	it('settles the accepted tilette with a brief entry state after the refresh completes', async () => {
		render(
			<TiletteInvitationRefreshContext.Provider value={mocks.refresh}>
				<StatusBoardView
					tilettes={[tilette('t1', [assignee(InvitationStatus.None, 0)])]}
					clusterId="c"
				/>
			</TiletteInvitationRefreshContext.Provider>
		);
		fireEvent.drop(columnOf('tilesharedemo.detail.status.inProgress'), {
			dataTransfer: { getData: () => 't1' },
		});
		await waitFor(() => expect(mocks.refresh).toHaveBeenCalledTimes(1));
		await waitFor(() => expect(cardOf('t1')).toHaveAttribute('data-just-accepted', 'true'));
		await new Promise((resolve) => setTimeout(resolve, 1200));
		expect(cardOf('t1')).not.toHaveAttribute('data-just-accepted');
	});

	it('grows the destination lane and collapses a ghost in the source lane', async () => {
		render(
			<TiletteInvitationRefreshContext.Provider value={mocks.refresh}>
				<StatusBoardView
					tilettes={[
						tilette('t1', [assignee(InvitationStatus.None, 0)]),
						tilette('t2', [assignee(InvitationStatus.None, 0)]),
					]}
					clusterId="c"
				/>
			</TiletteInvitationRefreshContext.Provider>
		);
		fireEvent.drop(columnOf('tilesharedemo.detail.status.inProgress'), {
			dataTransfer: { getData: () => 't1' },
		});
		await waitFor(() => expect(mocks.refresh).toHaveBeenCalledTimes(1));
		// The landed card is wrapped in a growing row so the lane opens its
		// space smoothly instead of jumping.
		await waitFor(() =>
			expect(screen.getByTestId('board-landing-row')).toContainElement(cardOf('t1'))
		);
		// A collapsing ghost holds t1's old slot in the Todo lane (before t2).
		const ghost = screen.getByTestId('board-leaving-placeholder');
		expect(ghost.parentElement!.firstElementChild).toBe(ghost);
		// ...and clears itself once the shrink/grow pair has finished.
		await waitFor(
			() => expect(screen.queryByTestId('board-leaving-placeholder')).not.toBeInTheDocument(),
			{ timeout: 1500 }
		);
	});

	it('accepts by drag for a Tentative viewer response too', () => {
		render(
			<StatusBoardView
				tilettes={[tilette('t1', [assignee(InvitationStatus.Tentative, 0)])]}
				clusterId="c"
			/>
		);
		fireEvent.drop(columnOf('tilesharedemo.detail.status.inProgress'), {
			dataTransfer: { getData: () => 't1' },
		});
		expect(mocks.respond).toHaveBeenCalledExactlyOnceWith('mine', InvitationStatus.Accepted);
	});

	it('ignores a drop whose tilette id is not on the board', () => {
		render(
			<StatusBoardView
				tilettes={[tilette('t1', [assignee(InvitationStatus.None, 0)])]}
				clusterId="c"
			/>
		);
		fireEvent.drop(columnOf('tilesharedemo.detail.status.inProgress'), {
			dataTransfer: { getData: () => 'ghost' },
		});
		expect(mocks.respond).not.toHaveBeenCalled();
	});

	it('does not re-accept a tilette the viewer has already accepted', () => {
		render(
			<StatusBoardView
				tilettes={[tilette('t1', [assignee(InvitationStatus.Accepted, 40)])]}
				clusterId="c"
			/>
		);
		fireEvent.drop(columnOf('tilesharedemo.detail.status.inProgress'), {
			dataTransfer: { getData: () => 't1' },
		});
		expect(mocks.respond).not.toHaveBeenCalled();
	});

	it('does not respond when the viewer is not assigned to the dropped tilette', () => {
		render(
			<StatusBoardView
				tilettes={[tilette('t1', [assignee(InvitationStatus.None, 0, 'other')])]}
				clusterId="c"
			/>
		);
		fireEvent.drop(columnOf('tilesharedemo.detail.status.inProgress'), {
			dataTransfer: { getData: () => 't1' },
		});
		expect(mocks.respond).not.toHaveBeenCalled();
	});

	it('keeps the data and allows a retry when the accept request fails', async () => {
		mocks.respond.mockRejectedValue(new Error('offline'));
		const changed = vi.fn();
		window.addEventListener('tileshare-changed', changed);
		try {
			render(
				<StatusBoardView
					tilettes={[tilette('t1', [assignee(InvitationStatus.None, 0)])]}
					clusterId="c"
				/>
			);
			fireEvent.drop(columnOf('tilesharedemo.detail.status.inProgress'), {
				dataTransfer: { getData: () => 't1' },
			});
			await waitFor(() => expect(mocks.respond).toHaveBeenCalledTimes(1));
			// Let the failed response settle so the in-flight guard is released.
			await new Promise((resolve) => setTimeout(resolve, 0));
			fireEvent.drop(columnOf('tilesharedemo.detail.status.inProgress'), {
				dataTransfer: { getData: () => 't1' },
			});
			await waitFor(() => expect(mocks.respond).toHaveBeenCalledTimes(2));
			expect(changed).not.toHaveBeenCalled();
			expect(mocks.refresh).not.toHaveBeenCalled();
		} finally {
			window.removeEventListener('tileshare-changed', changed);
		}
	});

	it('keeps the drop silhouette until the card lands, then lets it shrink out', async () => {
		let release: () => void = () => {};
		// The accept stays in flight until released.
		mocks.respond.mockImplementation(
			() =>
				new Promise<void>((resolve) => {
					release = resolve;
				})
		);
		// t1 is the draggable Todo tilette; t2 keeps the In progress lane
		// non-empty so its drop silhouette lives in the card list.
		render(
			<TiletteInvitationRefreshContext.Provider value={mocks.refresh}>
				<StatusBoardView
					tilettes={[
						tilette('t1', [assignee(InvitationStatus.None, 0)]),
						tilette('t2', [assignee(InvitationStatus.Accepted, 40)]),
					]}
					clusterId="c"
				/>
			</TiletteInvitationRefreshContext.Provider>
		);
		fireEvent.drop(columnOf('tilesharedemo.detail.status.inProgress'), {
			dataTransfer: { getData: () => 't1' },
		});
		await waitFor(() => expect(mocks.respond).toHaveBeenCalledTimes(1));
		// While the accept is in flight the silhouette still marks the landing spot.
		expect(screen.getByTestId('board-drop-silhouette')).toBeInTheDocument();

		release();
		// The landing commit wraps the accepted card in its growing row.
		await waitFor(() => expect(cardOf('t1')).toHaveAttribute('data-just-accepted', 'true'));
		// The silhouette switches to its shrinking track as the card grows in.
		expect(screen.getByTestId('board-drop-silhouette-leaving')).toBeInTheDocument();
		expect(screen.queryByTestId('board-drop-silhouette')).not.toBeInTheDocument();

		// ...and is gone once the shrink has finished.
		await waitFor(
			() =>
				expect(
					screen.queryByTestId('board-drop-silhouette-leaving')
				).not.toBeInTheDocument(),
			{ timeout: 1500 }
		);
	});

	it('flips the existing cards to their new slots instead of snapping them', async () => {
		const { container } = render(
			<StatusBoardView
				tilettes={[
					tilette('t1', [assignee(InvitationStatus.None, 0)]),
					tilette('t2', [assignee(InvitationStatus.None, 0)]),
				]}
				clusterId="c"
			/>
		);
		// Give t2 a pre-drop position; once the landing commit happens (flagged
		// by data-just-accepted) it reports the settled position (jsdom's zeros).
		const pre2: DOMRect = {
			top: 190,
			bottom: 282,
			left: 24,
			right: 264,
			width: 240,
			height: 92,
			x: 24,
			y: 190,
		};
		const zero2: DOMRect = {
			top: 0,
			bottom: 92,
			left: 24,
			right: 264,
			width: 240,
			height: 92,
			x: 24,
			y: 0,
		};
		cardOf('t2').getBoundingClientRect = () =>
			cardOf('t1').hasAttribute('data-just-accepted') ? zero2 : pre2;
		// Capture t2's inline transform at the FLIP's forced reflow: that is the
		// first frame, where the card is still held at its old slot.
		const board = container.firstElementChild!;
		let transformAtReflow: string | null = null;
		Object.defineProperty(board, 'offsetHeight', {
			get: () => {
				transformAtReflow = cardOf('t2').style.transform;
				return 0;
			},
			configurable: true,
		});

		flushSync(() => {
			fireEvent.drop(columnOf('tilesharedemo.detail.status.inProgress'), {
				dataTransfer: { getData: () => 't1' },
			});
		});
		// Wait for the landing commit (which runs the FLIP pass in a layout effect).
		await waitFor(() => expect(cardOf('t1')).toHaveAttribute('data-just-accepted', 'true'));

		// t2 is held at its old slot on the first frame and given a transform
		// transition, so it visibly gives way instead of snapping.
		expect(transformAtReflow).toBe('translateY(190px)');
		expect(cardOf('t2').style.transition).toContain('transform');

		// The inline styles are cleared once the flip has settled.
		await waitFor(() => expect(cardOf('t2').style.transform).toBe(''), { timeout: 1500 });
		expect(cardOf('t2').style.transition).toBe('');
	});
});
