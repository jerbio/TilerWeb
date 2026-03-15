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
}: UseEditTilePanelSyncOptions) {
  const wasPushedRef = useRef(false);

  useEffect(() => {
    if (editTileIsOpen && editTileEvent) {
      pushPanel({ content: null }); // actual content is wired by the caller
      setSidePanelExpanded(false);
      wasPushedRef.current = true;
    } else if (!editTileIsOpen && wasPushedRef.current) {
      popPanel();
      wasPushedRef.current = false;
    }
  }, [editTileIsOpen, editTileEvent, pushPanel, popPanel, setSidePanelExpanded]);

  const closePanelAndStore = useCallback(() => {
    popPanel();
    closeEditTile();
    wasPushedRef.current = false;
  }, [popPanel, closeEditTile]);

  return { closePanelAndStore };
}
