import { useEffect, useRef, useState } from 'react';
import { SignalRService, Hubs } from '@/services/SocketService';
import { CalendarSyncClient, type CalendarSyncState } from '@/services/calendarSyncClient';
import { CalendarSyncApi } from '@/api/calendarSyncApi';
import useAppStore, { SessionType } from '@/global_state';

/** Uses the existing socket, refreshing committed changes and recovering missed updates after reconnect. */
export function useScheduleSocket(onScheduleChange: () => void | Promise<void>) {
	const userId = useAppStore((state) =>
		state.activeSessionType === SessionType.AUTHENTICATED
			? state.authenticatedPersonaSession?.userId
			: undefined
	);
	const [status, setStatus] = useState<CalendarSyncState | null>(null);
	const [recoveryError, setRecoveryError] = useState(false);
	const [refreshError, setRefreshError] = useState(false);
	const [readyOwner, setReadyOwner] = useState<string | null>(null);
	const clientRef = useRef<CalendarSyncClient | null>(null);
	const onChangeRef = useRef(onScheduleChange);
	onChangeRef.current = onScheduleChange;

	useEffect(() => {
		setStatus(null);
		setRecoveryError(false);
		setRefreshError(false);
		setReadyOwner(null);
		if (!userId) return;
		let disposed = false;
		let initialLoadReleased = false;
		const releaseInitialLoad = () => {
			if (disposed || initialLoadReleased) return;
			initialLoadReleased = true;
			clearTimeout(startupTimer);
			setReadyOwner(userId);
		};
		// Do not leave the calendar waiting indefinitely for an unavailable socket.
		// A connection after this fallback must catch up.
		const startupTimer = setTimeout(releaseInitialLoad, 2000);
		const service = new SignalRService(userId);
		const api = new CalendarSyncApi();
		const client = new CalendarSyncClient({
			readStatus: () => api.getStatus(),
			refresh: () => onChangeRef.current(),
			status: setStatus,
			recoveryError: setRecoveryError,
			refreshError: setRefreshError,
		});
		clientRef.current = client;
		service.subscribe(
			Hubs.ScheduleChange.name,
			Hubs.ScheduleChange.events.CalendarSyncUpdated,
			(data) => client.receive(data)
		);
		service.subscribe(
			Hubs.ScheduleChange.name,
			Hubs.ScheduleChange.events.RefreshData,
			(data) => client.receiveRefresh(data)
		);
		service.onConnected(() => {
			if (disposed) return;
			// Initial loading only needs the subscription to be ready. Sync metadata
			// is independent and must not add a request or delay the first three ranges.
			if (!initialLoadReleased) {
				releaseInitialLoad();
				return;
			}
			// Catch up immediately after a reconnect or a late initial connection.
			// Metadata is independent, so a slow status endpoint cannot hold up events.
			client.refresh();
			void client.recover({ refresh: false, seedCursor: false });
		});
		// Show sync metadata while the initial connection is being established.
		// A late metadata response cannot confirm that the calendar includes that
		// completion, so leave its socket notification eligible to refresh the view.
		void client.recover({ refresh: false, seedCursor: false });
		service.createConnection();
		return () => {
			disposed = true;
			clearTimeout(startupTimer);
			client.dispose();
			service.dispose();
			if (clientRef.current === client) clientRef.current = null;
		};
	}, [userId]);

	return {
		ready: !userId || readyOwner === userId,
		status,
		recoveryError,
		refreshError,
		retry: () => {
			clientRef.current?.refresh();
			void clientRef.current?.recover();
		},
	};
}
