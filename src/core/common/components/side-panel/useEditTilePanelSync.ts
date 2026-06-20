import { useEffect, useRef, useCallback } from 'react';
import { CalendarEvent } from '@/core/common/types/schedule';
import { SidePanelEntry } from './side_panel_types';

interface UseEditTilePanelSyncOptions {
	editTileIsOpen: boolean;
	editTileEvent: CalendarEvent | null;
	pushPanel: (entry: SidePanelEntry) => void;
	popPanel: () => void;
	closeEditTile: () => void;
	setSidePanelExpanded: (expanded: boolean) => void;
	setMobileChatVisible: (visible: boolean) => void;
}

/**
 * Synchronises the editTile Zustand slice with the side-panel stack.
 *
 * - Pushes an edit panel when editTile opens (and auto-expands a collapsed panel).
 * - Pops the edit panel when editTile closes externally (store change).
 * - Exposes `closePanelAndStore` for the back-button / onClose callback.
 */
export function useEditTilePanelSync({
	editTileIsOpen,
	editTileEvent,
	pushPanel,
	popPanel,
	closeEditTile,
	setSidePanelExpanded,
	setMobileChatVisible,
}: UseEditTilePanelSyncOptions) {
	const wasPushedRef = useRef(false);
	const prevEventIdRef = useRef<string | null>(null);

	useEffect(() => {
		if (editTileIsOpen && editTileEvent && !wasPushedRef.current) {
			pushPanel({ content: null }); // actual content is wired by the caller
			setSidePanelExpanded(false);
			setMobileChatVisible(true);
			wasPushedRef.current = true;
			prevEventIdRef.current = editTileEvent.id;
		} else if (
			editTileIsOpen &&
			editTileEvent &&
			wasPushedRef.current &&
			editTileEvent.id !== prevEventIdRef.current
		) {
			// Event changed while panel already open — replace with new event
			popPanel();
			pushPanel({ content: null });
			prevEventIdRef.current = editTileEvent.id;
		} else if (!editTileIsOpen && wasPushedRef.current) {
			popPanel();
			wasPushedRef.current = false;
			prevEventIdRef.current = null;
		}
	}, [
		editTileIsOpen,
		editTileEvent,
		pushPanel,
		popPanel,
		setSidePanelExpanded,
		setMobileChatVisible,
	]);

	const closePanelAndStore = useCallback(() => {
		popPanel();
		closeEditTile();
		setMobileChatVisible(false);
		wasPushedRef.current = false;
		prevEventIdRef.current = null;
	}, [popPanel, closeEditTile, setMobileChatVisible]);

	return { closePanelAndStore };
}
