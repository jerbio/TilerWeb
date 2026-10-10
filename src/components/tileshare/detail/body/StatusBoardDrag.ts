import type { DragEvent } from 'react';

/** The MIME type carried in dataTransfer while dragging a tilette across the board. */
export const BOARD_DRAG_TYPE = 'application/x-tilette-id';

/** Mark the drag as carrying a tilette id (set on drag start). */
export function setBoardDragData(e: DragEvent, tiletteId: string): void {
	e.dataTransfer.setData(BOARD_DRAG_TYPE, tiletteId);
	e.dataTransfer.effectAllowed = 'move';
}

/** Read the dragged tilette id off a drop, or null if the drag isn't ours. */
export function getBoardDragTiletteId(e: DragEvent): string | null {
	const id = e.dataTransfer.getData(BOARD_DRAG_TYPE);
	return id || null;
}
