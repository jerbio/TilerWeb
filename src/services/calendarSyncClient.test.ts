import { describe, expect, it, vi } from 'vitest';
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
	};
	return { ...options, client: new CalendarSyncClient(options) };
}

describe('calendar sync client recovery and refresh coordination', () => {
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
