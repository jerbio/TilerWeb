import { useCallback, useEffect, useRef, useState } from 'react';
import { notesService } from '@/services';
import type { NotesPayload, NotesScope } from '@/core/common/types/schedule';

/** Conflict descriptor exposed by `useTileNotes` when the server reports a stale etag. */
export interface NotesConflict {
	/** The current server-side payload (after the rejected write). */
	server: NotesPayload;
	/** The local draft that the user attempted to save. */
	localDraft: string;
}

export interface UseTileNotesResult {
	payload: NotesPayload | null;
	isLoading: boolean;
	isSaving: boolean;
	error: Error | null;
	conflict: NotesConflict | null;
	/** Force a re-fetch of the current event's notes. */
	refresh: () => Promise<void>;
	/** Persist a new UserNote, returning the latest payload. */
	save: (userNote: string) => Promise<NotesPayload | null>;
	/** Dismiss the conflict marker (e.g. after merging). */
	clearConflict: () => void;
}

/**
 * Read/write hook for the `/api/CalendarEvent/Notes` endpoint.
 *
 * Concurrency is handled with the etag the server returned on the last load
 * or save. When the server rejects an update (`payload.concurrencyConflict`),
 * `conflict` is populated with both the latest server payload and the user's
 * local draft so the UI can offer a merge view.
 *
 * @param eventId  Tiler event id (calendar or sub-event). When `null` the hook
 *                 is inert.
 * @param scope    Which blob to target. Defaults to `'auto'` (sub-event blob
 *                 if non-empty, else calendar blob).
 */
export function useTileNotes(
	eventId: string | null,
	scope: NotesScope = 'auto'
): UseTileNotesResult {
	const [payload, setPayload] = useState<NotesPayload | null>(null);
	const [isLoading, setIsLoading] = useState<boolean>(eventId !== null);
	const [isSaving, setIsSaving] = useState(false);
	const [error, setError] = useState<Error | null>(null);
	const [conflict, setConflict] = useState<NotesConflict | null>(null);

	// Always read the freshest etag inside save() — even after a conflict — so
	// the next attempt uses what the server just returned.
	const payloadRef = useRef<NotesPayload | null>(null);
	useEffect(() => {
		payloadRef.current = payload;
	}, [payload]);

	const load = useCallback(async () => {
		if (!eventId) {
			setPayload(null);
			setIsLoading(false);
			return;
		}
		setIsLoading(true);
		setError(null);
		try {
			const next = await notesService.getNotes(eventId, scope);
			setPayload(next);
		} catch (err) {
			setError(err instanceof Error ? err : new Error(String(err)));
			setPayload(null);
		} finally {
			setIsLoading(false);
		}
	}, [eventId, scope]);

	useEffect(() => {
		void load();
	}, [load]);

	const save = useCallback(
		async (userNote: string): Promise<NotesPayload | null> => {
			if (!eventId) return null;
			setIsSaving(true);
			setError(null);
			try {
				const result = await notesService.updateNotes({
					EventID: eventId,
					Scope: scope,
					UserNote: userNote,
					Etag: payloadRef.current?.Etag ?? '',
				});
				setPayload(result);
				if (result.concurrencyConflict) {
					setConflict({ server: result, localDraft: userNote });
				} else {
					setConflict(null);
				}
				return result;
			} catch (err) {
				setError(err instanceof Error ? err : new Error(String(err)));
				return null;
			} finally {
				setIsSaving(false);
			}
		},
		[eventId, scope]
	);

	const clearConflict = useCallback(() => setConflict(null), []);

	return {
		payload,
		isLoading,
		isSaving,
		error,
		conflict,
		refresh: load,
		save,
		clearConflict,
	};
}

export default useTileNotes;
