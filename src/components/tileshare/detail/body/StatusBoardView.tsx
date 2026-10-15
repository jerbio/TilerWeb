import StatusBoardColumn from './StatusBoardColumn';
import Tabs from '@/core/common/components/Tabs';
import { TiletteInvitationRefreshContext } from '@/components/tileshare/TiletteInvitationActions';
import {
	useCallback,
	useContext,
	useEffect,
	useLayoutEffect,
	useMemo,
	useRef,
	useState,
} from 'react';
import {
	TileletteStatus,
	TileShareTemplate,
	InvitationStatus,
} from '@/core/common/types/tileshare';
import {
	deriveTileletteStatus,
	deriveMyTileletteStatus,
	isMineAssignment,
	canAcceptByDrag,
} from '@/core/util/tileshareProgress';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/core/auth/useAuth';
import { TileshareApi } from '@/api/tileshareApi';
import { getBoardDragTiletteId } from './StatusBoardDrag';
import { validDesignatedUsers } from '@/core/util/tileshareAssignees';

type Props = {
	tilettes: TileShareTemplate[];
	clusterId: string;
};

type BoardFilter = 'all' | 'mine';

const api = new TileshareApi();

export default function StatusBoardView({ tilettes, clusterId }: Props) {
	const { t } = useTranslation();
	const { user } = useAuth();
	const refresh = useContext(TiletteInvitationRefreshContext);
	const [filter, setFilter] = useState<BoardFilter>('all');
	// Guards against double-firing the accept while a drag request is in flight.
	const accepting = useRef<Set<string>>(new Set());
	// Id of the tilette whose accept request is in flight; the card shows a
	// transient "Accepting…" indicator (shimmer + badge) while set.
	const [acceptingId, setAcceptingId] = useState<string | null>(null);
	// Id of the tilette that was just accepted; the card plays a one-shot
	// settle-in animation the moment it re-renders in the In progress lane.
	const [justAcceptedId, setJustAcceptedId] = useState<string | null>(null);
	const settleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
	// Ghost left behind in the Todo lane where the accepted card used to be.
	// It collapses over 300ms (while the destination lane grows) so the
	// remaining cards glide down instead of snapping up.
	const [leaving, setLeaving] = useState<{ id: string; index: number; height: number } | null>(
		null
	);
	const leavingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
	// Where to measure card positions for the FLIP pass (the whole board).
	const boardRef = useRef<HTMLDivElement | null>(null);
	// Card positions just before an accept reflow, so the affected cards can
	// be flipped to their new slots instead of teleporting.
	const flipPrevRects = useRef<Map<string, DOMRect> | null>(null);
	const flipCleanup = useRef<(() => void) | null>(null);
	useEffect(
		() => () => {
			if (settleTimer.current) clearTimeout(settleTimer.current);
			if (leavingTimer.current) clearTimeout(leavingTimer.current);
			if (flipCleanup.current) flipCleanup.current();
		},
		[]
	);

	// "Just me" shows only the viewer's own assignments and derives each lane
	// from the viewer's RSVP + completion alone.
	const visible = useMemo(() => {
		if (filter === 'mine' && user?.id) {
			return tilettes.filter((tilette) => isMineAssignment(tilette, user.id));
		}
		return tilettes;
	}, [tilettes, filter, user?.id]);

	const resolveStatus = useCallback(
		(tilette: TileShareTemplate): TileletteStatus => {
			if (filter === 'mine' && user?.id) {
				return deriveMyTileletteStatus(tilette, user.id);
			}
			return deriveTileletteStatus(tilette);
		},
		[filter, user?.id]
	);

	const todo: TileShareTemplate[] = [];
	const inProgress: TileShareTemplate[] = [];
	const completed: TileShareTemplate[] = [];

	for (const tilette of visible) {
		const status = resolveStatus(tilette);
		if (status === TileletteStatus.Todo) {
			todo.push(tilette);
		} else if (status === TileletteStatus.Completed) {
			completed.push(tilette);
		} else {
			inProgress.push(tilette);
		}
	}

	// FLIP: when an accept lands and the lanes reflow, every card that moved is
	// flipped to its new slot (transform from the captured position, then
	// transition back) so the other cards visibly give way instead of
	// snapping. Runs before paint, so there is no one-frame jump.
	useLayoutEffect(() => {
		const prev = flipPrevRects.current;
		flipPrevRects.current = null;
		if (!prev) return;
		if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
		if (flipCleanup.current) flipCleanup.current();

		const scope = boardRef.current ?? document;
		const moved: { el: HTMLElement; from: number; to: number }[] = [];
		prev.forEach((rect, id) => {
			if (id === justAcceptedId) return; // The landing card animates in via its growing row.
			const el = scope.querySelector<HTMLElement>(`[data-board-card-id="${id}"]`);
			if (!el) return; // The card changed lanes; its new copy owns the settle-in.
			const next = el.getBoundingClientRect();
			const delta = rect.top - next.top;
			if (Math.abs(delta) < 1) return;
			moved.push({ el, from: delta, to: 0 });
		});
		if (moved.length === 0) return;

		moved.forEach((m) => {
			m.el.style.transition = 'none';
			m.el.style.transform = `translateY(${m.from}px)`;
		});
		void (boardRef.current ?? document.documentElement).offsetHeight; // Commit the pre-positions so the next frame is a real transition.
		let done = false;
		const finish = () => {
			if (done) return;
			done = true;
			moved.forEach((m) => {
				m.el.style.transition = '';
				m.el.style.transform = '';
			});
		};
		moved.forEach((m) => {
			m.el.style.transition = 'transform 300ms ease-out';
			m.el.style.transform = `translateY(${m.to}px)`;
		});
		const safety = setTimeout(finish, 450);
		const unbind = (first: HTMLElement) => (e: TransitionEvent) => {
			if (e.propertyName !== 'transform') return;
			first.removeEventListener('transitionend', unbind(first) as EventListener);
			finish();
		};
		moved.forEach((m) =>
			m.el.addEventListener('transitionend', unbind(m.el) as EventListener, { once: true })
		);
		flipCleanup.current = () => {
			finish();
			clearTimeout(safety);
		};
	}, [justAcceptedId]);

	// Dragging a Todo tilette onto the In progress lane accepts the viewer's
	// invitation (silent — no confirmation dialog). It only fires when the
	// viewer's own RSVP is still open (None or Tentative) and can be responded
	// to; everything else (not assigned, already resolved) is a no-op.
	const handleAcceptDrop = useCallback(
		async (e: React.DragEvent) => {
			e.preventDefault();
			const tiletteId = getBoardDragTiletteId(e);
			// One-shot settle-in flag: cleared after 1s so the card's entry
			// animation only plays once when it lands in its new lane.
			const flagJustAccepted = (id: string, slot: { index: number; height: number }) => {
				if (settleTimer.current) clearTimeout(settleTimer.current);
				setJustAcceptedId(id);
				settleTimer.current = setTimeout(() => setJustAcceptedId(null), 1000);
				// Leave a collapsing ghost in the card's old slot, then drop it
				// a beat after the 300ms shrink/grow pair has finished.
				setLeaving({ id, ...slot });
				if (leavingTimer.current) clearTimeout(leavingTimer.current);
				leavingTimer.current = setTimeout(() => setLeaving(null), 400);
			};
			if (!tiletteId || !user?.id) return;
			const tilette = tilettes.find((entry) => entry.id === tiletteId);
			if (!tilette || !canAcceptByDrag(tilette, user.id)) return;
			const assignmentId = validDesignatedUsers(tilette.designatedUsers).find(
				(d) => d.userId === user.id
			)?.designatedTileTemplateId;
			if (!assignmentId || accepting.current.has(assignmentId)) return;

			// Snapshot the card's lane slot + height while it is still mounted
			// in Todo, so the lane can leave a same-size ghost where it moved from.
			let fromIndex = 0;
			for (const entry of visible) {
				if (entry.id === tiletteId) break;
				if (resolveStatus(entry) === TileletteStatus.Todo) fromIndex += 1;
			}
			const cardEl = document.querySelector<HTMLElement>(
				`[data-board-card-id="${tiletteId}"]`
			);
			const fromHeight = cardEl?.offsetHeight || 92;

			// Snapshot every card's position before the reflow so the FLIP
			// pass can glide the ones that had to make room for the landing
			// card (mostly the other lanes' cards, which shift as this one
			// moves across the board).
			const scope = boardRef.current ?? document;
			const next = new Map<string, DOMRect>();
			scope.querySelectorAll<HTMLElement>('[data-board-card-id]').forEach((el) => {
				const cardId = el.dataset.boardCardId;
				if (cardId) next.set(cardId, el.getBoundingClientRect());
			});
			flipPrevRects.current = next;

			accepting.current.add(assignmentId);
			setAcceptingId(tiletteId);
			try {
				await api.respondToInvitation(assignmentId, InvitationStatus.Accepted);
				// Notify anything else listening (the activity feed, the list) and
				// refetch the page's cluster detail so the card leaves Todo.
				window.dispatchEvent(new Event('tileshare-changed'));
				await refresh?.().catch(() => {});
				flagJustAccepted(tiletteId, { index: fromIndex, height: fromHeight });
			} catch {
				// The refresh keeps the existing data, so the card simply stays in
				// Todo; the user can retry the drag or use the inline actions.
			} finally {
				accepting.current.delete(assignmentId);
				setAcceptingId(null);
			}
		},
		[tilettes, user?.id, refresh, visible, resolveStatus]
	);

	return (
		<Board ref={boardRef}>
			<FilterRow>
				<Tabs
					aria-label={t('tilesharedemo.detail.board.filterAria')}
					value={filter}
					onChange={(id) => setFilter(id as BoardFilter)}
					tabs={[
						{ id: 'all', label: t('tilesharedemo.detail.board.filter.all') },
						{ id: 'mine', label: t('tilesharedemo.detail.board.filter.mine') },
					]}
				/>
			</FilterRow>
			<BoardGrid>
				<StatusBoardColumn
					status={TileletteStatus.Todo}
					tilettes={todo}
					clusterId={clusterId}
					draggable
					acceptingId={acceptingId}
					justAcceptedId={justAcceptedId}
					leaving={leaving}
				/>
				<StatusBoardColumn
					status={TileletteStatus.InProgress}
					tilettes={inProgress}
					clusterId={clusterId}
					onDrop={handleAcceptDrop}
					acceptingId={acceptingId}
					justAcceptedId={justAcceptedId}
				/>
				<StatusBoardColumn
					status={TileletteStatus.Completed}
					tilettes={completed}
					clusterId={clusterId}
				/>
			</BoardGrid>
		</Board>
	);
}

const Board = styled.div`
	display: flex;
	flex-direction: column;
	gap: 12px;
`;

const FilterRow = styled.div`
	display: flex;
	justify-content: flex-end;
`;

const BoardGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(3, minmax(280px, 1fr));
	gap: 14px;
	overflow-x: auto;
	padding: 4px 4px 12px;
	/* Stretch: every lane fills the board's full height, so an empty lane
	 * (e.g. In progress) always offers room to drop a dragged tilette. */
`;
