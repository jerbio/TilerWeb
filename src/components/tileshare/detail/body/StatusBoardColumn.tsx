import StatusBoardTiletteCard from './StatusBoardTiletteCard';
import TiletteStatus from './TiletteStatus';
import { TileletteStatus, TileShareTemplate } from '@/core/common/types/tileshare';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import styled, { css, keyframes } from 'styled-components';
import { useTranslation } from 'react-i18next';

type Props = {
	status: TileletteStatus;
	tilettes: TileShareTemplate[];
	clusterId: string;
	/** When set, the column is a drop target (e.g. In progress accepts a drag).
	 *  May return a promise (the accept round-trip); the landing silhouette
	 *  stays visible until the caller's card has settled. */
	onDrop?: (e: React.DragEvent) => void | Promise<void>;
	/** When true the cards become drag sources (only the Todo lane can drag). */
	draggable?: boolean;
	/** Id of the tilette whose accept request is in flight (shows the indicator). */
	acceptingId?: string | null;
	/** Id of the tilette that just landed in this lane (plays the settle-in). */
	justAcceptedId?: string | null;
	/** A tilette that just left this lane; a collapsing ghost holds its old slot. */
	leaving?: { id: string; index: number; height: number } | null;
};

export default function StatusBoardColumn({
	status,
	tilettes,
	clusterId,
	onDrop,
	draggable,
	acceptingId,
	justAcceptedId,
	leaving,
}: Props) {
	const { t } = useTranslation();
	const [dragOver, setDragOver] = useState(false);
	// dragenter / dragleave both fire as the pointer crosses child-element
	// boundaries (the cards, the silhouette, the header) inside the lane, so a
	// plain boolean flickers out mid-drag. A depth counter keeps the silhouette
	// on while the pointer is anywhere within the column and only clears it once
	// the pointer has left the whole subtree — even if it then sits still.
	const depth = useRef(0);
	// The lane body silhouette is a stand-in for the incoming card, so it must
	// not vanish the instant the drop fires (that was the top-of-lane jump).
	// It holds its slot while the accept round-trip runs, then cross-fades out
	// exactly as the landing card grows in below it.
	const [silhouetteLeaving, setSilhouetteLeaving] = useState(false);
	const silhouetteLeaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
	const prevJustAcceptedId = useRef<string | null>(null);
	const prevAcceptingId = useRef<string | null>(null);
	useEffect(
		() => () => {
			if (silhouetteLeaveTimer.current) clearTimeout(silhouetteLeaveTimer.current);
		},
		[]
	);
	useLayoutEffect(() => {
		if (!onDrop) return;
		if (justAcceptedId && justAcceptedId !== prevJustAcceptedId.current) {
			// A card just landed in this lane: shrink the silhouette out while
			// the landing card grows in, then unmount it a beat later.
			setSilhouetteLeaving(true);
			if (silhouetteLeaveTimer.current) clearTimeout(silhouetteLeaveTimer.current);
			silhouetteLeaveTimer.current = setTimeout(() => {
				setSilhouetteLeaving(false);
				setDragOver(false);
			}, 350);
		} else if (
			justAcceptedId === null &&
			acceptingId === null &&
			prevAcceptingId.current !== null
		) {
			// The accept ended without a card landing in this lane (the request
			// failed, or the card settled elsewhere): drop the silhouette
			// straight away so it can never get stuck.
			setSilhouetteLeaving(false);
			setDragOver(false);
		}
		prevJustAcceptedId.current = justAcceptedId ?? null;
		prevAcceptingId.current = acceptingId ?? null;
	}, [justAcceptedId, acceptingId, onDrop]);
	// Highlight the lane body (the cards, or the empty slot) while a drag hovers.
	const droppable = !!onDrop && dragOver;
	// Where the collapsing ghost sits in the card list (clamped so a stale index
	// can never push it past the end of the lane).
	const leavingPos = leaving ? Math.max(0, Math.min(leaving.index, tilettes.length)) : 0;
	const leavingNode = leaving ? (
		<LeavingRow
			key="board-leaving"
			data-testid="board-leaving-placeholder"
			aria-hidden="true"
			style={
				{
					'--lane-h': `${leaving.height}px`,
					// The 10px negatives cancel CardList's gap once the ghost is
					// fully collapsed, so the settled layout matches the post-
					// unmount layout exactly (no residual jump).
					'--lane-mt': leavingPos > 0 ? '-10px' : '0px',
					'--lane-mb': leavingPos < tilettes.length ? '-10px' : '0px',
				} as React.CSSProperties
			}
		>
			<LeavingGhost>
				<SkeletonLine $width="45%" />
				<SkeletonLine $width="70%" />
			</LeavingGhost>
		</LeavingRow>
	) : null;

	const handleDragEnter = (e: React.DragEvent) => {
		if (!onDrop) return;
		e.preventDefault();
		depth.current += 1;
		setDragOver(true);
	};

	const handleDragLeave = () => {
		if (!onDrop) return;
		depth.current = Math.max(0, depth.current - 1);
		if (depth.current === 0) setDragOver(false);
	};

	const handleDrop = (e: React.DragEvent) => {
		if (!onDrop) return;
		depth.current = 0;
		// A drop only fires on the hovered lane; make sure the silhouette is
		// on (even if the hover state was missed) and keep it mounted while the
		// accept round-trip runs — the settle effect above removes it once the
		// card has landed (or right away if it never did).
		setDragOver(true);
		void onDrop(e);
	};

	return (
		<Column
			onDrop={handleDrop}
			// dragover must be allowed (preventDefault) for the browser to fire drop.
			onDragOver={onDrop ? (e: React.DragEvent) => e.preventDefault() : undefined}
			onDragEnter={onDrop ? handleDragEnter : undefined}
			onDragLeave={onDrop ? handleDragLeave : undefined}
		>
			<ColumnHeader>
				<TiletteStatus status={status} showLabel />
				<Count>{tilettes.length}</Count>
			</ColumnHeader>
			{tilettes.length === 0 ? (
				// The empty slot is the drop surface itself: it keeps a
				// card-height footprint so a dragged tilette always has room to land.
				<EmptySlot $droppable={droppable}>
					{droppable ? (
						silhouetteLeaving ? (
							// The accepted card is growing into the lane: shrink the
							// silhouette out over the same 300ms instead of snapping
							// it away.
							<DropLeaveRow
								data-testid="board-drop-silhouette-leaving"
								aria-hidden="true"
							>
								<DropPlaceholder $settled>
									<SkeletonLine $width="45%" />
									<SkeletonLine $width="70%" />
								</DropPlaceholder>
							</DropLeaveRow>
						) : (
							<>
								<DropPlaceholder
									data-testid="board-drop-silhouette"
									aria-hidden="true"
								>
									<SkeletonLine $width="45%" />
									<SkeletonLine $width="70%" />
								</DropPlaceholder>
								<DropHintText>
									{t('tilesharedemo.detail.board.dropHint')}
								</DropHintText>
							</>
						)
					) : (
						t('tilesharedemo.detail.board.empty')
					)}
				</EmptySlot>
			) : (
				<CardList $droppable={droppable}>
					{droppable &&
						(silhouetteLeaving ? (
							// The accepted card is growing in right below: shrink the
							// silhouette out over the same 300ms instead of snapping
							// it away (which used to jump the top of the lane).
							<DropLeaveRow
								data-testid="board-drop-silhouette-leaving"
								aria-hidden="true"
							>
								<DropPlaceholder $settled>
									<SkeletonLine $width="45%" />
									<SkeletonLine $width="70%" />
								</DropPlaceholder>
							</DropLeaveRow>
						) : (
							// A ghost silhouette of where the dragged tilette will land.
							<DropPlaceholder data-testid="board-drop-silhouette" aria-hidden="true">
								<SkeletonLine $width="45%" />
								<SkeletonLine $width="70%" />
							</DropPlaceholder>
						))}
					{tilettes.map((tilette, index) => {
						const card = (
							<StatusBoardTiletteCard
								key={tilette.id}
								tilette={tilette}
								clusterId={clusterId}
								draggable={draggable}
								accepting={acceptingId === tilette.id}
								justAccepted={justAcceptedId === tilette.id}
							/>
						);
						const items: React.ReactNode[] = [];
						// Leave a collapsing ghost in the slot the tilette just vacated.
						if (leavingNode && index === leavingPos) items.push(leavingNode);
						if (justAcceptedId === tilette.id) {
							// Grow the card in from zero height so the lane opens up
							// smoothly instead of the space jumping into place.
							items.push(
								<LandingRow
									key={`${tilette.id}-landing`}
									data-testid="board-landing-row"
								>
									<LandingInner>{card}</LandingInner>
								</LandingRow>
							);
						} else {
							items.push(card);
						}
						return items;
					})}
					{leavingNode && leavingPos >= tilettes.length ? leavingNode : null}
				</CardList>
			)}
		</Column>
	);
}

const Column = styled.div`
	display: flex;
	flex-direction: column;
	gap: 10px;
	min-width: 0;
	/* Even when every lane is short (or a lane is empty) there is room to hover and drop. */
	min-height: 220px;
`;

const ColumnHeader = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 8px;
`;

const Count = styled.span`
	flex-shrink: 0;
	font-size: ${({ theme }) => theme.typography.fontSize.xs};
	font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
	color: ${({ theme }) => theme.colors.text.secondary};
`;

/**
 * Empty lane body. When the lane accepts drops (In progress) this slot is the
 * drop surface itself, so it keeps a card-height footprint and highlights
 * while a drag hovers it.
 */
const EmptySlot = styled.div<{ $droppable: boolean }>`
	flex: 1;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 10px;
	min-height: 140px;
	padding: 18px 14px;
	border: 1px dashed
		${({ $droppable, theme }) =>
			$droppable ? theme.colors.border.strong : theme.colors.border.default};
	border-radius: ${({ theme }) => theme.borderRadius.large};
	background: ${({ theme }) => theme.colors.background.card2};
	color: ${({ $droppable, theme }) =>
		$droppable ? theme.colors.text.secondary : theme.colors.text.muted};
	font-size: ${({ theme }) => theme.typography.fontSize.sm};
	text-align: center;
	transition:
		border-color 150ms ease,
		color 150ms ease;
`;

/** The silhouette fades in and eases down when the lane starts accepting. */
const silhouetteIn = keyframes`
	from {
		opacity: 0;
		transform: translateY(4px);
	}
	to {
		opacity: 0.75;
		transform: translateY(0);
	}
`;

/**
 * Ghost silhouette of a tilette card. It mimics a card's footprint (a couple of
 * skeleton lines) so the user can see exactly where the dragged tilette will land.
 */
const DropPlaceholder = styled.div<{ $settled?: boolean }>`
	width: 100%;
	display: flex;
	flex-direction: column;
	flex-shrink: 0;
	gap: 8px;
	padding: 0.875rem;
	border: 2px dashed ${({ theme }) => theme.colors.border.strong};
	border-radius: ${({ theme }) => theme.borderRadius.large};
	background: ${({ theme }) => theme.colors.background.card2};
	opacity: 0.75;
	transition: opacity 150ms ease;
	/* $settled: already entered (it is now leaving), so skip the fade-up. */
	${({ $settled }) =>
		!$settled &&
		css`
			animation: ${silhouetteIn} 150ms ease both;
		`}
	@media (prefers-reduced-motion: reduce) {
		animation: none;
	}
`;

/** The silhouette's track shrinks from 1fr to 0fr as the landing card grows. */
const leaveRow = keyframes`
	from {
		grid-template-rows: 1fr;
		opacity: 1;
	}
	to {
		grid-template-rows: 0fr;
		opacity: 0;
	}
`;

/**
 * Wrapping track for the silhouette while it leaves. It shrinks over the same
 * 300ms the landing card grows, so the slot hands over to the new card
 * instead of the whole lane jumping up by the silhouette's height.
 * margin-top -10px cancels CardList's gap once fully collapsed.
 */
const DropLeaveRow = styled.div`
	display: grid;
	grid-template-rows: 1fr;
	margin-top: -10px;
	animation: ${leaveRow} 300ms ease-out both;

	> * {
		min-height: 0;
		overflow: hidden;
	}

	@media (prefers-reduced-motion: reduce) {
		display: none;
	}
`;

/** A single skeleton bar inside the drop silhouette (name / progress rows). */
const SkeletonLine = styled.div<{ $width: string }>`
	height: 10px;
	width: ${({ $width }) => $width};
	border-radius: 999px;
	background: ${({ theme }) => theme.colors.border.default};
`;

/** The "Drop here to accept" caption shown under the silhouette in an empty lane. */
const DropHintText = styled.span`
	font-size: ${({ theme }) => theme.typography.fontSize.sm};
	color: ${({ theme }) => theme.colors.text.secondary};
`;

const CardList = styled.div<{ $droppable: boolean }>`
	/* Fills the lane so a drop always has empty space below the last card. */
	flex: 1;
	display: flex;
	flex-direction: column;
	gap: 10px;
	min-height: ${({ $droppable }) => ($droppable ? '44px' : '0')};
	border-radius: ${({ $droppable, theme }) => ($droppable ? theme.borderRadius.large : '0')};
	outline: ${({ $droppable, theme }) =>
		$droppable ? `2px dashed ${theme.colors.border.strong}` : 'none'};
	outline-offset: 4px;
	transition:
		min-height 150ms ease,
		border-radius 150ms ease;
`;

/** The lane's track grows from 0fr to 1fr, opening room for the landing card.
 *  No opacity here: the card is visible from the first frame (it owns its
 *  own settle-in fade), so the lane reads as one continuous motion. */
const laneGrow = keyframes`
	from {
		grid-template-rows: 0fr;
	}
	to {
		grid-template-rows: 1fr;
	}
`;

/**
 * Wraps the just-accepted card so the lane's space opens up gradually instead
 * of the card (and its full footprint) appearing at once. The base track is
 * 1fr (the final state); the animation fills backwards from 0fr, so the card
 * stays fully visible if animations are unsupported or reduced.
 */
const LandingRow = styled.div`
	display: grid;
	grid-template-rows: 1fr;
	animation: ${laneGrow} 300ms ease-out both;

	> * {
		min-height: 0;
		overflow: hidden;
	}

	@media (prefers-reduced-motion: reduce) {
		animation: none;
	}
`;

/** Clipping wrapper inside the grid track (required for the 0fr -> 1fr grow). */
const LandingInner = styled.div`
	min-height: 0;
	overflow: hidden;
`;

/** The ghost collapses from the card's captured height, absorbing its lane gap. */
const laneShrink = keyframes`
	from {
		height: var(--lane-h);
		opacity: 0.7;
	}
	to {
		height: 0;
		opacity: 0;
		margin-top: var(--lane-mt);
		margin-bottom: var(--lane-mb);
	}
`;

/**
 * Placeholder left in the lane where a tilette just moved out. It shrinks away
 * over the same 300ms the destination lane grows, so the remaining cards glide
 * down instead of snapping up. --lane-mt/--lane-mb cancel CardList's 10px gap
 * as it collapses so the settled layout matches the final one exactly.
 */
const LeavingRow = styled.div`
	width: 100%;
	height: var(--lane-h);
	overflow: hidden;
	flex-shrink: 0;
	pointer-events: none;
	animation: ${laneShrink} 300ms ease-out both;

	@media (prefers-reduced-motion: reduce) {
		animation: none;
		display: none;
	}
`;

/** Dashed silhouette filling the collapsing ghost while it shrinks. */
const LeavingGhost = styled.div`
	display: flex;
	flex-direction: column;
	gap: 8px;
	height: 100%;
	box-sizing: border-box;
	padding: 0.875rem;
	border: 2px dashed ${({ theme }) => theme.colors.border.strong};
	border-radius: ${({ theme }) => theme.borderRadius.large};
	background: ${({ theme }) => theme.colors.background.card2};
	opacity: 0.6;
`;
