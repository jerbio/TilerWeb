import { useEffect, useRef, useCallback } from 'react';
import { CalendarEvent } from '@/core/common/types/schedule';
import { SidePanelEntry } from './side_panel_types';

interface UseEditNotesPanelSyncOptions {
	editNotesIsOpen: boolean;
	editNotesEvent: CalendarEvent | null;
	pushPanel: (entry: SidePanelEntry) => void;
	popPanel: () => void;
	closeEditNotes: () => void;
	setSidePanelExpanded: (expanded: boolean) => void;
	setMobileChatVisible: (visible: boolean) => void;
}

/**
 * Synchronises the `editNotes` Zustand slice with the side-panel stack.
 *
 * Mirrors `useEditTilePanelSync`: pushes the rich notes editor onto the panel
 * stack when the slice opens, swaps content if the user opens notes for a
 * different tile, and pops it when the slice closes externally.
 */
export function useEditNotesPanelSync({
	editNotesIsOpen,
	editNotesEvent,
	pushPanel,
	popPanel,
	closeEditNotes,
	setSidePanelExpanded,
	setMobileChatVisible,
}: UseEditNotesPanelSyncOptions) {
	const wasPushedRef = useRef(false);
	const prevEventIdRef = useRef<string | null>(null);

	useEffect(() => {
		if (editNotesIsOpen && editNotesEvent && !wasPushedRef.current) {
			pushPanel({ content: null });
			setSidePanelExpanded(false);
			setMobileChatVisible(true);
			wasPushedRef.current = true;
			prevEventIdRef.current = editNotesEvent.id;
		} else if (
			editNotesIsOpen &&
			editNotesEvent &&
			wasPushedRef.current &&
			editNotesEvent.id !== prevEventIdRef.current
		) {
			popPanel();
			pushPanel({ content: null });
			prevEventIdRef.current = editNotesEvent.id;
		} else if (!editNotesIsOpen && wasPushedRef.current) {
			popPanel();
			wasPushedRef.current = false;
			prevEventIdRef.current = null;
		}
	}, [
		editNotesIsOpen,
		editNotesEvent,
		pushPanel,
		popPanel,
		setSidePanelExpanded,
		setMobileChatVisible,
	]);

	const closePanelAndStore = useCallback(() => {
		popPanel();
		closeEditNotes();
		setMobileChatVisible(false);
		wasPushedRef.current = false;
		prevEventIdRef.current = null;
	}, [popPanel, closeEditNotes, setMobileChatVisible]);

	return { closePanelAndStore };
}
