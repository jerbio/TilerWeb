import type { CalendarSyncStatus, CalendarSyncUpdate } from './calendarSyncClient';

export function syncUpdate(
	state: CalendarSyncUpdate['state'] = 'completed',
	overrides: Partial<CalendarSyncUpdate> = {}
): CalendarSyncUpdate {
	return {
		eventId: '1'.repeat(32),
		changeId: '2'.repeat(32),
		generation: 1,
		attempt: 1,
		providers: 1,
		state,
		scheduleRevision: state === 'completed' ? 'native-revision' : null,
		windowStart: state === 'completed' ? '2026-10-24T12:00:00Z' : null,
		windowEnd: state === 'completed' ? '2026-10-31T12:00:00Z' : null,
		scheduleChanged: state === 'completed' ? false : null,
		invalidateExternalData: state === 'completed',
		errorCode: state === 'failed' ? 'ProviderUnavailable' : null,
		willRetry: state === 'failed',
		...overrides,
	};
}

export function syncStatus(overrides: Partial<CalendarSyncStatus> = {}): CalendarSyncStatus {
	const update = syncUpdate();
	return {
		state: 'completed',
		requestedGeneration: 1,
		generation: 1,
		completedGeneration: 1,
		attempt: 1,
		changeId: update.changeId,
		providers: 1,
		scheduleRevision: update.scheduleRevision,
		windowStart: update.windowStart,
		windowEnd: update.windowEnd,
		scheduleChanged: false,
		errorCode: null,
		willRetry: false,
		updatedAt: '2026-10-24T12:01:00Z',
		...overrides,
	};
}

export function deferred<T>() {
	let resolve!: (value: T) => void;
	let reject!: (error: unknown) => void;
	const promise = new Promise<T>((yes, no) => {
		resolve = yes;
		reject = no;
	});
	return { promise, resolve, reject };
}

export async function flushSyncClient() {
	for (let index = 0; index < 8; index++) await Promise.resolve();
}
