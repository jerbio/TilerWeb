import { afterEach, describe, expect, it, vi } from 'vitest';
import {
	CalendarSyncClient,
	CalendarSyncCursor,
	parseCalendarSyncStatus,
	parseCalendarSyncUpdate,
} from './calendarSyncClient';
import { deferred, flushSyncClient, syncStatus, syncUpdate } from './calendarSyncClient.fixtures';

describe('calendar sync wire contract and ordering', () => {
	it.each(['started', 'completed', 'failed'] as const)('accepts %s metadata', (state) => {
		expect(parseCalendarSyncUpdate(syncUpdate(state))).not.toBeNull();
	});
	it.each([
		{ eventId: 'provider-id' },
		{ generation: 0 },
		{ generation: Number.MAX_SAFE_INTEGER + 1 },
		{ attempt: 0 },
		{ providers: 4 },
		{ state: 'other' },
		{ scheduleRevision: null },
		{ windowEnd: 'not-a-date' },
		{ scheduleChanged: null },
		{ invalidateExternalData: false },
		{ errorCode: 'raw event contents' },
		{ willRetry: true },
	])('rejects malformed metadata %j', (override) => {
		expect(parseCalendarSyncUpdate({ ...syncUpdate(), ...override })).toBeNull();
	});
	it('rejects stale result fields on a failed notification', () => {
		expect(
			parseCalendarSyncUpdate(syncUpdate('failed', { scheduleRevision: 'old-result' }))
		).toBeNull();
	});
	it('keeps pending work separate from the last committed result', () => {
		const status = syncStatus({
			state: 'processing',
			requestedGeneration: 4,
			generation: 4,
			completedGeneration: 3,
		});
		expect(parseCalendarSyncStatus(status)).toEqual(status);
		expect(parseCalendarSyncStatus({ ...status, completedGeneration: 5 })).toBeNull();
		expect(parseCalendarSyncStatus({ ...status, requestedGeneration: 2 })).toBeNull();
	});
	it('accepts a first queued request without a fabricated result', () => {
		expect(
			parseCalendarSyncStatus(
				syncStatus({
					state: 'queued',
					generation: 0,
					completedGeneration: 0,
					attempt: 0,
					changeId: null,
					scheduleRevision: null,
					windowStart: null,
					windowEnd: null,
					scheduleChanged: null,
				})
			)
		).not.toBeNull();
	});
	it('deduplicates the terminal/legacy pair and cannot regress after completion', () => {
		const cursor = new CalendarSyncCursor();
		expect(cursor.accept(syncUpdate('started'))).toBe(true);
		expect(cursor.accept(syncUpdate('started'))).toBe(false);
		expect(cursor.accept(syncUpdate())).toBe(true);
		expect(cursor.accept(syncUpdate())).toBe(false);
		expect(cursor.accept(syncUpdate('started'))).toBe(false);
	});
	it('accepts a retry while rejecting older attempts and generations', () => {
		const cursor = new CalendarSyncCursor();
		expect(cursor.accept(syncUpdate('failed'))).toBe(true);
		expect(cursor.accept(syncUpdate('started', { attempt: 2 }))).toBe(true);
		expect(cursor.accept(syncUpdate())).toBe(false);
		expect(cursor.accept(syncUpdate('started', { generation: 2 }))).toBe(true);
		expect(cursor.accept(syncUpdate('completed', { attempt: 20 }))).toBe(false);
	});
	it('seeds running and terminal states from a recovery snapshot', () => {
		const cursor = new CalendarSyncCursor();
		cursor.seed(
			syncStatus({
				state: 'processing',
				generation: 3,
				requestedGeneration: 3,
				completedGeneration: 2,
			})
		);
		expect(cursor.accept(syncUpdate('completed', { generation: 2 }))).toBe(false);
		expect(cursor.accept(syncUpdate('completed', { generation: 3 }))).toBe(true);
		cursor.seed(
			syncStatus({
				state: 'queued',
				generation: 4,
				requestedGeneration: 5,
				completedGeneration: 4,
			})
		);
		expect(cursor.accept(syncUpdate('completed', { generation: 4 }))).toBe(false);
		expect(cursor.accept(syncUpdate('started', { generation: 5 }))).toBe(true);
	});
});

function setup() {
	const options = {
		readStatus: vi.fn().mockResolvedValue(syncStatus()),
		refresh: vi.fn().mockResolvedValue(undefined),
		status: vi.fn(),
		recoveryError: vi.fn(),
		refreshError: vi.fn(),
		failureVisibility: vi.fn(),
	};
	return { ...options, client: new CalendarSyncClient(options) };
}

describe('calendar sync client recovery and refresh coordination', () => {
	it('keeps a historical failed snapshot as status without announcing a new failure', async () => {
		const { client, readStatus, status, failureVisibility } = setup();
		const failed = syncStatus({
			state: 'failed',
			errorCode: 'CalculationFailed',
			willRetry: false,
			generation: 27,
			requestedGeneration: 27,
			completedGeneration: 26,
			attempt: 5,
			updatedAt: '2026-11-11T19:02:23Z',
		});
		readStatus.mockResolvedValue(failed);
		await client.recover({ refresh: false, seedCursor: false });
		expect(status).toHaveBeenLastCalledWith(failed);
		expect(failureVisibility).toHaveBeenLastCalledWith(false);
		await client.recover({ refresh: false, seedCursor: false });
		client.receive(
			syncUpdate('failed', {
				generation: 27,
				attempt: 5,
				errorCode: 'CalculationFailed',
				willRetry: false,
			})
		);
		expect(failureVisibility.mock.calls.every(([visible]) => visible === false)).toBe(true);
		client.dispose();
	});

	it('announces a failure recovered after observing an active attempt', async () => {
		const { client, readStatus, failureVisibility } = setup();
		client.receive(syncUpdate('started'));
		readStatus.mockResolvedValue(
			syncStatus({ state: 'failed', errorCode: 'CalculationFailed', willRetry: false })
		);
		await client.recover({ refresh: false });
		expect(failureVisibility).toHaveBeenLastCalledWith(true);
		client.dispose();
	});

	it('announces a newer missed failure on reconnect after establishing an earlier baseline', async () => {
		const { client, readStatus, failureVisibility } = setup();
		await client.recover({ refresh: false, seedCursor: false });
		readStatus.mockResolvedValue(
			syncStatus({
				state: 'failed',
				generation: 2,
				requestedGeneration: 2,
				errorCode: 'ProviderUnavailable',
				willRetry: false,
			})
		);
		await client.recover({ refresh: false, seedCursor: false });
		expect(failureVisibility).toHaveBeenLastCalledWith(true);
		client.dispose();
	});

	it('shows live failures and clears their presentation when a new attempt starts', async () => {
		const { client, failureVisibility } = setup();
		client.receive(syncUpdate('failed', { willRetry: false }));
		expect(failureVisibility).toHaveBeenLastCalledWith(true);
		client.receive(syncUpdate('started', { attempt: 2 }));
		expect(failureVisibility).toHaveBeenLastCalledWith(false);
		client.dispose();
	});

	it('does not carry a previously shown failure into a newly mounted client', async () => {
		const previous = setup();
		previous.client.receive(syncUpdate('failed', { willRetry: false }));
		previous.client.dispose();
		const next = setup();
		next.readStatus.mockResolvedValue(
			syncStatus({ state: 'failed', errorCode: 'ProviderUnavailable', willRetry: false })
		);
		await next.client.recover({ refresh: false });
		expect(next.failureVisibility).toHaveBeenLastCalledWith(false);
		next.client.dispose();
	});
	it('loads mount metadata without invalidating the calendar read already started by the view', async () => {
		const { client, readStatus, refresh, status, recoveryError } = setup();
		await client.recover({ refresh: false });
		await flushSyncClient();
		expect(readStatus).toHaveBeenCalledOnce();
		expect(status).toHaveBeenCalledExactlyOnceWith(syncStatus());
		expect(recoveryError).toHaveBeenLastCalledWith(false);
		expect(refresh).not.toHaveBeenCalled();
	});
	it('keeps completion notifications eligible when independent metadata cannot confirm view freshness', async () => {
		const { client, refresh, status } = setup();
		await client.recover({ refresh: false, seedCursor: false });
		await flushSyncClient();
		expect(status).toHaveBeenCalledWith(syncStatus());
		expect(refresh).not.toHaveBeenCalled();
		client.receive(syncUpdate());
		client.receiveRefresh({ calendarSync: syncUpdate() });
		await flushSyncClient();
		expect(refresh).toHaveBeenCalledOnce();
	});
	it('still refreshes on initial connection and later reconnects with identical sync metadata', async () => {
		const { client, refresh } = setup();
		await client.recover({ refresh: false });
		await client.recover();
		await flushSyncClient();
		expect(refresh).toHaveBeenCalledOnce();
		// Sync metadata does not record every native edit made during a disconnect.
		await client.recover();
		await flushSyncClient();
		expect(refresh).toHaveBeenCalledTimes(2);
	});
	it('refreshes external-only changes once for both completion callbacks', async () => {
		const { client, refresh, status } = setup();
		const update = syncUpdate();
		client.receive(update);
		client.receiveRefresh({ refreshData: { trigger: true }, calendarSync: update });
		await flushSyncClient();
		expect(refresh).toHaveBeenCalledTimes(1);
		expect(status).toHaveBeenCalledTimes(1);
	});
	it('does not refresh for started, provider-read failure, or invalid sync metadata', async () => {
		const { client, refresh } = setup();
		client.receive(syncUpdate('started'));
		client.receive(syncUpdate('failed'));
		client.receiveRefresh({ calendarSync: { state: 'completed' } });
		await flushSyncClient();
		expect(refresh).not.toHaveBeenCalled();
	});
	it.each([true, false])(
		'refreshes potentially committed native changes while retaining failure (willRetry=%s)',
		async (willRetry) => {
			const { client, refresh, status, readStatus } = setup();
			const failed = syncUpdate('failed', { errorCode: 'CalculationFailed', willRetry });
			client.receive(failed);
			client.receiveRefresh({ calendarSync: failed });
			await flushSyncClient();
			expect(refresh).toHaveBeenCalledOnce();
			expect(status).toHaveBeenCalledExactlyOnceWith(failed);
			expect(readStatus).not.toHaveBeenCalled();
		}
	);
	it('does not regress a completion or refresh again for a delayed failure from the same attempt', async () => {
		const { client, refresh, status } = setup();
		const completed = syncUpdate();
		client.receive(completed);
		await flushSyncClient();
		client.receive(syncUpdate('failed', { errorCode: 'CalculationFailed' }));
		await flushSyncClient();
		expect(status).toHaveBeenCalledExactlyOnceWith(completed);
		expect(refresh).toHaveBeenCalledOnce();
	});
	it('retains failure status if the saved view read also fails and a later read retry succeeds', async () => {
		const { client, refresh, refreshError, status } = setup();
		const failed = syncUpdate('failed', { errorCode: 'CalculationFailed', willRetry: false });
		refresh.mockRejectedValueOnce(new Error('view unavailable'));
		client.receive(failed);
		await flushSyncClient();
		expect(refreshError).toHaveBeenLastCalledWith(true);
		client.refresh();
		await flushSyncClient();
		expect(refreshError).toHaveBeenLastCalledWith(false);
		expect(status).toHaveBeenCalledExactlyOnceWith(failed);
		expect(refresh).toHaveBeenCalledTimes(2);
	});
	it('refreshes both connected clients for external-only completion without requiring a changed native schedule', async () => {
		const first = setup();
		const second = setup();
		const update = syncUpdate('completed', { scheduleChanged: false });
		first.client.receive(update);
		second.client.receive(update);
		await flushSyncClient();
		expect(first.refresh).toHaveBeenCalledOnce();
		expect(second.refresh).toHaveBeenCalledOnce();
		expect(first.status).toHaveBeenCalledExactlyOnceWith(update);
		expect(second.status).toHaveBeenCalledExactlyOnceWith(update);
	});
	it('recovers the saved view after missing a failure notification without presenting completion', async () => {
		const { client, readStatus, refresh, status } = setup();
		const failed = syncStatus({
			state: 'failed',
			generation: 2,
			requestedGeneration: 2,
			completedGeneration: 1,
			errorCode: 'CalculationFailed',
			willRetry: false,
		});
		readStatus.mockResolvedValueOnce(failed);
		await client.recover();
		await flushSyncClient();
		expect(refresh).toHaveBeenCalledOnce();
		expect(status).toHaveBeenCalledExactlyOnceWith(failed);
	});
	it('preserves legacy schedule refreshes', async () => {
		const { client, refresh } = setup();
		client.receiveRefresh({ refreshData: { trigger: true } });
		await flushSyncClient();
		expect(refresh).toHaveBeenCalledOnce();
	});
	it('coalesces bursts and follows a read with another when newer work completes in flight', async () => {
		const { client, refresh } = setup();
		const first = deferred<void>();
		refresh.mockReturnValueOnce(first.promise);
		client.receive(syncUpdate());
		client.receive(syncUpdate('completed', { generation: 2 }));
		await flushSyncClient();
		expect(refresh).toHaveBeenCalledTimes(1);
		client.receive(syncUpdate('completed', { generation: 3 }));
		await flushSyncClient();
		expect(refresh).toHaveBeenCalledTimes(1);
		first.resolve();
		await flushSyncClient();
		expect(refresh).toHaveBeenCalledTimes(2);
	});
	it('recovers missed completions even while a newer generation is running', async () => {
		const { client, readStatus, refresh, status } = setup();
		const snapshot = syncStatus({ state: 'processing', generation: 2, requestedGeneration: 2 });
		readStatus.mockResolvedValueOnce(snapshot);
		await client.recover();
		await flushSyncClient();
		expect(status).toHaveBeenCalledWith(snapshot);
		expect(refresh).toHaveBeenCalledOnce();
		client.receive(syncUpdate());
		expect(status).toHaveBeenCalledTimes(1);
		client.receive(syncUpdate('completed', { generation: 2 }));
		await flushSyncClient();
		expect(refresh).toHaveBeenCalledTimes(2);
	});
	it('does not let an older HTTP snapshot replace a newer push', async () => {
		const { client, readStatus, status } = setup();
		const pending = deferred<ReturnType<typeof syncStatus>>();
		readStatus.mockReturnValueOnce(pending.promise);
		const recovery = client.recover();
		const current = syncUpdate('completed', { generation: 3 });
		client.receive(current);
		pending.resolve(syncStatus());
		await recovery;
		expect(status).toHaveBeenCalledTimes(1);
		expect(status).toHaveBeenLastCalledWith(current);
	});
	it('ignores a superseded reconnect response', async () => {
		const { client, readStatus, status } = setup();
		const older = deferred<ReturnType<typeof syncStatus>>();
		readStatus.mockReturnValueOnce(older.promise);
		const first = client.recover();
		const newer = syncStatus({ generation: 3, requestedGeneration: 3, completedGeneration: 3 });
		readStatus.mockResolvedValueOnce(newer);
		await client.recover();
		older.resolve(syncStatus());
		await first;
		expect(status).toHaveBeenCalledTimes(1);
		expect(status).toHaveBeenLastCalledWith(newer);
	});
	it('an older failed HTTP recovery cannot override a newer live status', async () => {
		const { client, readStatus, recoveryError } = setup();
		const pending = deferred<ReturnType<typeof syncStatus>>();
		readStatus.mockReturnValueOnce(pending.promise);
		const recovery = client.recover();
		client.receive(syncUpdate());
		pending.reject(new Error('old request failed'));
		await recovery;
		expect(recoveryError).toHaveBeenLastCalledWith(false);
	});
	it('disabled or unused sync returns no invented status or extra refresh', async () => {
		const { client, readStatus, status, refresh } = setup();
		readStatus.mockResolvedValueOnce(null);
		await client.recover();
		await flushSyncClient();
		expect(status).not.toHaveBeenCalled();
		expect(refresh).not.toHaveBeenCalled();
	});
	it('reports failed recovery without presenting success', async () => {
		const { client, readStatus, recoveryError, status } = setup();
		readStatus.mockRejectedValueOnce(new Error('unavailable'));
		await client.recover();
		expect(recoveryError).toHaveBeenLastCalledWith(true);
		expect(status).not.toHaveBeenCalled();
	});
	it('keeps failed display reads retryable', async () => {
		const { client, refresh, refreshError } = setup();
		refresh.mockRejectedValueOnce(new Error('read failed'));
		client.receive(syncUpdate());
		await flushSyncClient();
		expect(refreshError).toHaveBeenLastCalledWith(true);
		client.refresh();
		await flushSyncClient();
		expect(refresh).toHaveBeenCalledTimes(2);
		expect(refreshError).toHaveBeenLastCalledWith(false);
	});
	it('drops pending owner responses and queued refreshes on disposal', async () => {
		const { client, readStatus, status, refresh } = setup();
		const pending = deferred<ReturnType<typeof syncStatus>>();
		readStatus.mockReturnValueOnce(pending.promise);
		const recovery = client.recover();
		client.refresh();
		client.dispose();
		pending.resolve(syncStatus());
		await recovery;
		await flushSyncClient();
		client.receive(syncUpdate());
		await client.recover();
		expect(status).not.toHaveBeenCalled();
		expect(refresh).not.toHaveBeenCalled();
		expect(readStatus).toHaveBeenCalledTimes(1);
	});
});

describe('recalculation activity', () => {
	const progress = () => ({
		...syncUpdate('started'),
		state: 'progress',
		activity: 'recalculating',
		sequence: 2,
	});
	it('accepts progress without refreshing and ignores older progress after completion', async () => {
		const { client, status, refresh } = setup();
		client.receive(syncUpdate('started', { sequence: 1 }));
		client.receive(progress());
		expect(status).toHaveBeenLastCalledWith(progress());
		expect(refresh).not.toHaveBeenCalled();
		client.receive(syncUpdate('completed', { sequence: 3 }));
		client.receive(progress());
		await flushSyncClient();
		expect(status).toHaveBeenLastCalledWith(syncUpdate('completed', { sequence: 3 }));
		expect(refresh).toHaveBeenCalledOnce();
		client.dispose();
	});
	it('keeps activity until the completed schedule is actually refreshed', async () => {
		const pending = deferred<void>();
		const { client, refresh, activity } = setupActivity();
		refresh.mockReturnValue(pending.promise);
		client.receive(progress());
		expect(activity).toHaveBeenLastCalledWith('recalculating');
		client.receive(syncUpdate('completed', { sequence: 3 }));
		await flushSyncClient();
		expect(activity).toHaveBeenLastCalledWith('recalculating');
		pending.resolve();
		await flushSyncClient();
		expect(activity).toHaveBeenLastCalledWith(null);
		client.dispose();
	});
});

function setupActivity() {
	const options = {
		readStatus: vi.fn().mockResolvedValue(syncStatus()),
		refresh: vi.fn<() => Promise<void | boolean>>().mockResolvedValue(undefined),
		status: vi.fn(),
		recoveryError: vi.fn(),
		refreshError: vi.fn(),
		activity: vi.fn(),
	};
	return { ...options, client: new CalendarSyncClient(options) };
}

describe('activity recovery and visible refresh fencing', () => {
	afterEach(() => vi.useRealTimers());
	const progress = (generation = 1) => ({
		...syncUpdate('started', { generation }),
		state: 'progress',
		activity: 'recalculating',
		sequence: 2,
	});

	it('does not show activity for a started attempt followed by metadata-only completion', async () => {
		const { client, activity } = setupActivity();
		client.receive(syncUpdate('started'));
		client.receive(syncUpdate());
		await flushSyncClient();
		expect(activity).not.toHaveBeenCalled();
		client.dispose();
	});
	it('polls pending work after five seconds and stops after a recovered completion', async () => {
		vi.useFakeTimers();
		const { client, activity, readStatus } = setupActivity();
		readStatus.mockResolvedValue(syncStatus({ sequence: 3 }));
		client.receive(progress());
		await vi.advanceTimersByTimeAsync(4999);
		expect(readStatus).not.toHaveBeenCalled();
		await vi.advanceTimersByTimeAsync(1);
		expect(readStatus).toHaveBeenCalledOnce();
		expect(activity).toHaveBeenLastCalledWith(null);
		await vi.advanceTimersByTimeAsync(15000);
		expect(readStatus).toHaveBeenCalledOnce();
		client.dispose();
	});
	it('restores live activity from status and clears it when the lease expires', async () => {
		const { client, activity, readStatus } = setupActivity();
		readStatus.mockResolvedValue(
			syncStatus({ state: 'processing', activity: 'recalculating', sequence: 2 })
		);
		await client.recover({ refresh: false });
		expect(activity).toHaveBeenLastCalledWith('recalculating');
		readStatus.mockResolvedValue(
			syncStatus({ state: 'processing', activity: null, activityExpired: true, sequence: 2 })
		);
		await client.recover({ refresh: false });
		expect(activity).toHaveBeenLastCalledWith(null);
		client.dispose();
	});
	it('retains activity on a failed refresh and clears it after a successful read retry', async () => {
		const { client, activity, refresh, refreshError } = setupActivity();
		refresh.mockRejectedValueOnce(new Error('read failed'));
		client.receive(progress());
		client.receive(syncUpdate('completed', { sequence: 3 }));
		await flushSyncClient();
		expect(refreshError).toHaveBeenLastCalledWith(true);
		expect(activity).toHaveBeenLastCalledWith('recalculating');
		client.refresh();
		await flushSyncClient();
		expect(refreshError).toHaveBeenLastCalledWith(false);
		expect(activity).toHaveBeenLastCalledWith(null);
		client.dispose();
	});
	it('retries superseded reads after yielding and never clears activity from that read', async () => {
		vi.useFakeTimers();
		const { client, activity, refresh } = setupActivity();
		refresh.mockResolvedValueOnce(false);
		client.receive(progress());
		client.receive(syncUpdate('completed', { sequence: 3 }));
		await flushSyncClient();
		expect(activity).toHaveBeenLastCalledWith('recalculating');
		expect(refresh).toHaveBeenCalledOnce();
		await vi.advanceTimersByTimeAsync(100);
		expect(refresh).toHaveBeenCalledTimes(2);
		expect(activity).toHaveBeenLastCalledWith(null);
		client.dispose();
	});
	it('cannot dismiss a newer calculation when an older display refresh finishes', async () => {
		const first = deferred<void>(),
			second = deferred<void>();
		const { client, activity, refresh } = setupActivity();
		refresh.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);
		client.receive(progress());
		client.receive(syncUpdate('completed', { sequence: 3 }));
		await flushSyncClient();
		client.receive(progress(2));
		client.receive(syncUpdate('completed', { generation: 2, sequence: 6 }));
		first.resolve();
		await flushSyncClient();
		expect(activity).toHaveBeenLastCalledWith('recalculating');
		second.resolve();
		await flushSyncClient();
		expect(activity).toHaveBeenLastCalledWith(null);
		client.dispose();
	});
	it('does not let a slow recovery snapshot resurrect completed activity', async () => {
		const pending = deferred<ReturnType<typeof syncStatus>>();
		const { client, activity, readStatus } = setupActivity();
		client.receive(progress());
		readStatus.mockReturnValue(pending.promise);
		const recovering = client.recover({ refresh: false });
		client.receive(syncUpdate('completed', { sequence: 3 }));
		await flushSyncClient();
		pending.resolve(
			syncStatus({ state: 'processing', activity: 'recalculating', sequence: 2 })
		);
		await recovering;
		expect(activity).toHaveBeenLastCalledWith(null);
		client.dispose();
	});
	it('cancels polling and deferred refresh retries on disposal', async () => {
		vi.useFakeTimers();
		const { client, readStatus, refresh } = setupActivity();
		refresh.mockResolvedValueOnce(false);
		client.receive(progress());
		client.receive(syncUpdate('completed', { sequence: 3 }));
		await flushSyncClient();
		client.dispose();
		await vi.advanceTimersByTimeAsync(15000);
		expect(readStatus).not.toHaveBeenCalled();
		expect(refresh).toHaveBeenCalledOnce();
	});
});
