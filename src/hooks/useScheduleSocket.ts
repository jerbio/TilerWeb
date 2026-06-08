import { useEffect, useRef, useCallback } from 'react';
import { SignalRService, Hubs, type SubscriptionHandle } from '@/services/SocketService';
import useAppStore from '@/global_state';

/**
 * Hook that listens for schedule changes via the SignalR `scheduleChange` hub.
 * When a schedule change is detected, it calls the provided `onScheduleChange` callback.
 *
 * The hook manages the WebSocket lifecycle (connect on mount, dispose on unmount)
 * and automatically reconnects when the userId changes.
 *
 * @param onScheduleChange - Callback invoked when a schedule change is received from the server.
 */
export function useScheduleSocket(onScheduleChange: () => void) {
	const socketRef = useRef<SignalRService | null>(null);
	const handleRef = useRef<SubscriptionHandle | null>(null);

	// Get userId from the active persona session
	const getActivePersonaSession = useAppStore((state) => state.getActivePersonaSession);
	const activePersonaSession = getActivePersonaSession();
	const userId = activePersonaSession?.userId;

	// Stable callback ref to avoid re-subscribing when the callback identity changes
	const onChangeRef = useRef(onScheduleChange);
	onChangeRef.current = onScheduleChange;

	const handleScheduleChange = useCallback((data: unknown) => {
		console.log('[useScheduleSocket] Schedule change detected via WebSocket:', data);
		onChangeRef.current();
	}, []);

	useEffect(() => {
		if (!userId) return;

		// Create the SignalR service and start the connection
		const service = new SignalRService(userId);
		service.createConnection();

		// Subscribe to schedule change events
		const handle = service.subscribe(
			Hubs.ScheduleChange.name,
			Hubs.ScheduleChange.events.RefreshData,
			handleScheduleChange
		);

		socketRef.current = service;
		handleRef.current = handle;

		return () => {
			// Cleanup: unsubscribe and dispose the connection
			if (socketRef.current && handleRef.current) {
				socketRef.current.unsubscribe(handleRef.current);
			}
			if (socketRef.current) {
				socketRef.current.dispose();
				socketRef.current = null;
			}
			handleRef.current = null;
		};
	}, [userId, handleScheduleChange]);
}
