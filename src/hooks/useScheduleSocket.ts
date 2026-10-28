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
	const clientRef = useRef<CalendarSyncClient | null>(null);
	const onChangeRef = useRef(onScheduleChange);
	onChangeRef.current = onScheduleChange;

	useEffect(() => {
		setStatus(null);
		setRecoveryError(false);
		setRefreshError(false);
		if (!userId) return;
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
			void client.recover();
		});
		// Reading on mount also covers an unavailable socket; reconnect recovery then closes any subsequent gap.
		void client.recover();
		service.createConnection();
		return () => {
			client.dispose();
			service.dispose();
			if (clientRef.current === client) clientRef.current = null;
		};
	}, [userId]);

	return {
		status,
		recoveryError,
		refreshError,
		retry: () => {
			clientRef.current?.refresh();
			void clientRef.current?.recover();
		},
	};
}
