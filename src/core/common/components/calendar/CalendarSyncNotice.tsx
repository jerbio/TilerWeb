import { useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import useUiStore from '@/core/ui/uiStore';
import type { CalendarSyncActivity, CalendarSyncState } from '@/services/calendarSyncClient';

/** Keep activity copy separate from the queue lifecycle and provider transport. */
const activityMessages: Record<CalendarSyncActivity, { key: string; fallback: string }> = {
	recalculating: {
		key: 'calendar.sync.recalculating',
		fallback: 'Updating your schedule from Google Calendar\u2026',
	},
};

/** Controls an existing floating toast; renders no calendar-layout content. */
export function CalendarSyncNotice({
	ownerId,
	status,
	showFailure = false,
	activity,
	recoveryError,
	refreshError,
	retry,
}: {
	ownerId?: string | null;
	status: CalendarSyncState | null;
	showFailure?: boolean;
	activity?: CalendarSyncActivity | null;
	recoveryError: boolean;
	refreshError: boolean;
	retry: () => void;
}) {
	const { t } = useTranslation();
	const show = useUiStore((state) => state.notification.show);
	const dismiss = useUiStore((state) => state.notification.dismiss);
	const retryRef = useRef(retry);
	useEffect(() => {
		retryRef.current = retry;
	}, [retry]);
	const retryLatest = useCallback(() => retryRef.current(), []);
	const id = ownerId ? `calendar-sync-${ownerId}` : null;
	let message: string | null = null;
	let error = false;
	let canRetry = false;
	if (refreshError) {
		message = t('calendar.sync.refreshFailed', 'Your calendar view could not refresh.');
		error = true;
		canRetry = true;
	} else if (recoveryError) {
		message = t('calendar.sync.statusFailed', 'Unable to check calendar updates.');
		error = true;
		canRetry = true;
	} else if (status?.errorCode === 'CredentialsRequired') {
		message = t(
			'calendar.sync.reconnect',
			'Reconnect your calendar in Settings to resume updates.'
		);
		error = true;
	} else if (status && 'activityExpired' in status && status.activityExpired) {
		message = t(
			'calendar.sync.interrupted',
			'Calendar updating was interrupted. Checking for recovery.'
		);
		error = true;
		canRetry = true;
	} else if (showFailure && status && (status.state === 'failed' || status.errorCode)) {
		message = status.willRetry
			? t(
					'calendar.sync.retrying',
					'Calendar updates could not be completed. Trying again\u2026'
				)
			: t('calendar.sync.failed', 'Calendar updates could not be completed.');
		error = true;
	} else if (activity) {
		const copy = activityMessages[activity];
		message = t(copy.key, copy.fallback);
	}
	const actionLabel = canRetry ? t('calendar.sync.retry', 'Try again') : null;
	// A rerender/reconnect for the same attempt must not recreate a dismissed error.
	// A genuinely newer failure must still be shown even when its translated copy is identical.
	const failureAttempt =
		error && !refreshError && !recoveryError && status
			? JSON.stringify([
					status.changeId,
					status.generation,
					status.attempt,
					status.errorCode,
					status.willRetry,
				])
			: null;
	useEffect(
		() => () => {
			if (id) dismiss(id);
		},
		[id, dismiss]
	);
	useEffect(() => {
		if (!id) return;
		if (!message) {
			dismiss(id);
			return;
		}
		show(id, message, error ? 'error' : 'loading', null, {
			dismissible: error,
			action: actionLabel ? { label: actionLabel, onClick: retryLatest } : undefined,
		});
	}, [id, message, error, failureAttempt, actionLabel, retryLatest, show, dismiss]);
	return null;
}
