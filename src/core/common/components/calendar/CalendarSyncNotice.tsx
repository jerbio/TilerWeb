import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import type { CalendarSyncState } from '@/services/calendarSyncClient';

const Notice = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 12px;
	padding: 8px 12px;
	font-size: 13px;
`;

/** Keeps live sync feedback outside tile editors and simulation review state. */
export function CalendarSyncNotice({
	status,
	recoveryError,
	refreshError,
	retry,
}: {
	status: CalendarSyncState | null;
	recoveryError: boolean;
	refreshError: boolean;
	retry: () => void;
}) {
	const { t } = useTranslation();
	let message: string;
	let canRetry = false;
	if (refreshError) {
		message = t('calendar.sync.refreshFailed', 'Your calendar view could not refresh.');
		canRetry = true;
	} else if (recoveryError) {
		message = t('calendar.sync.statusFailed', 'Unable to check calendar updates.');
		canRetry = true;
	} else if (status?.errorCode === 'CredentialsRequired')
		message = t(
			'calendar.sync.reconnect',
			'Reconnect your calendar in Settings to resume updates.'
		);
	else if (status?.state === 'failed' || status?.errorCode) {
		message = status.willRetry
			? t('calendar.sync.retrying', 'Calendar updates could not be completed. Trying again…')
			: t('calendar.sync.failed', 'Calendar updates could not be completed.');
	} else if (status && ['queued', 'processing', 'started'].includes(status.state))
		message = t('calendar.sync.processing', 'Updating your calendar…');
	else return null;
	return (
		<Notice role="status" aria-live="polite">
			<span>{message}</span>
			{canRetry && (
				<button type="button" onClick={retry}>
					{t('calendar.sync.retry', 'Try again')}
				</button>
			)}
		</Notice>
	);
}
