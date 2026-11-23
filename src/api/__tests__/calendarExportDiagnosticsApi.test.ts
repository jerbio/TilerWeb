import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CalendarExportDiagnosticsApi } from '../calendarExportDiagnosticsApi';
vi.mock('@/config/config_getter', () => ({ Env: { get: () => 'https://tiler.example/' } }));
vi.mock('@/services/locationService', () => ({ default: {} }));
const fetchMock = vi.fn();
describe('CalendarExportDiagnosticsApi', () => {
	it('queues reviewed destination association with exact account and calendar routing', async () => {
		fetchMock.mockResolvedValueOnce(
			new Response(JSON.stringify({ userId: 'user', queued: true }), { status: 202 })
		);
		await new CalendarExportDiagnosticsApi().reuseDestination(
			'user',
			'account',
			'legacy/calendar'
		);
		const [url, options] = fetchMock.mock.calls[0];
		expect(url).toContain('/destinations/reuse');
		expect(JSON.parse(options.body)).toEqual({
			authenticationId: 'account',
			calendarId: 'legacy/calendar',
		});
	});
	it('never retries an uncertain cleanup action or accepts another user acknowledgment', async () => {
		fetchMock.mockResolvedValueOnce(
			new Response(JSON.stringify({ userId: 'other', queued: true }), { status: 202 })
		);
		await expect(
			new CalendarExportDiagnosticsApi().cleanupDestinations('user', 'account')
		).rejects.toThrow('Invalid destination action');
		expect(fetchMock).toHaveBeenCalledTimes(1);
	});
	beforeEach(() => {
		vi.stubGlobal('fetch', fetchMock);
		fetchMock.mockReset();
	});
	it('queues export-only repair without a native generation', async () => {
		const result = { userId: 'user/id', queued: true, scheduledExports: 1, activeExports: 0 };
		fetchMock.mockResolvedValueOnce(new Response(JSON.stringify(result), { status: 202 }));
		expect(await new CalendarExportDiagnosticsApi().repair('user/id')).toEqual(result);
		const [url, options] = fetchMock.mock.calls[0];
		expect(url).toContain('users/user%2Fid/repair');
		expect(options.method).toBe('POST');
	});
	it('rejects repair acknowledgment for a different user', async () => {
		fetchMock.mockResolvedValueOnce(
			new Response(
				JSON.stringify({
					userId: 'other',
					queued: true,
					scheduledExports: 1,
					activeExports: 0,
				}),
				{ status: 202 }
			)
		);
		await expect(new CalendarExportDiagnosticsApi().repair('user')).rejects.toThrow(
			'Invalid calendar repair'
		);
	});
	it('reads an audit without using the repair endpoint', async () => {
		fetchMock.mockResolvedValueOnce(
			new Response(JSON.stringify({ userId: 'user', audits: [] }), { status: 200 })
		);
		expect(await new CalendarExportDiagnosticsApi().audit('user')).toEqual([]);
		const [url, options] = fetchMock.mock.calls[0];
		expect(url).toContain('/audit');
		expect(options.method).toBe('POST');
		expect(options.cache).toBe('no-store');
	});
	it('rejects an audit for a different target or malformed report', async () => {
		fetchMock.mockResolvedValueOnce(
			new Response(JSON.stringify({ userId: 'other', audits: [] }), { status: 200 })
		);
		await expect(new CalendarExportDiagnosticsApi().audit('user')).rejects.toThrow(
			'Invalid export audit'
		);
		fetchMock.mockResolvedValueOnce(
			new Response(JSON.stringify({ userId: 'user', audits: [{}] }), { status: 200 })
		);
		await expect(new CalendarExportDiagnosticsApi().audit('user')).rejects.toThrow(
			'Invalid export audit'
		);
	});
	it('queues an explicit retry through the admin POST endpoint', async () => {
		const result = {
			userId: 'user/id',
			queued: true,
			generation: 31,
			scheduledExports: 1,
			activeExports: 0,
			nativeAlreadyProcessing: false,
		};
		fetchMock.mockResolvedValueOnce(new Response(JSON.stringify(result), { status: 202 }));
		expect(await new CalendarExportDiagnosticsApi().retry('user/id')).toEqual(result);
		const [url, options] = fetchMock.mock.calls[0];
		expect(url).toBe('https://tiler.example/api/admin/CalendarExport/users/user%2Fid/retry');
		expect(options.method).toBe('POST');
		expect(options.body).toBeUndefined();
	});
	it('does not silently repeat a forbidden mutation', async () => {
		fetchMock.mockResolvedValueOnce(new Response('{}', { status: 403 }));
		await expect(new CalendarExportDiagnosticsApi().retry('user')).rejects.toBeDefined();
		expect(fetchMock).toHaveBeenCalledTimes(1);
	});
	it.each([
		{
			userId: 'another',
			queued: true,
			generation: 1,
			scheduledExports: 0,
			activeExports: 0,
			nativeAlreadyProcessing: false,
		},
		{
			userId: 'user',
			queued: false,
			generation: 1,
			scheduledExports: 0,
			activeExports: 0,
			nativeAlreadyProcessing: false,
		},
		{
			userId: 'user',
			queued: true,
			generation: 0,
			scheduledExports: 0,
			activeExports: 0,
			nativeAlreadyProcessing: false,
		},
	])('rejects malformed or mismatched retry acknowledgments', async (result) => {
		fetchMock.mockResolvedValueOnce(new Response(JSON.stringify(result), { status: 202 }));
		await expect(new CalendarExportDiagnosticsApi().retry('user')).rejects.toThrow(
			'Invalid calendar retry acknowledgment'
		);
	});
	it('uses the separate admin endpoint without caching', async () => {
		fetchMock.mockResolvedValueOnce(
			new Response(JSON.stringify({ exports: [] }), { status: 200 })
		);
		expect(await new CalendarExportDiagnosticsApi().list('user/id')).toEqual([]);
		const [url, options] = fetchMock.mock.calls[0];
		expect(url).toBe('https://tiler.example/api/admin/CalendarExport/users/user%2Fid');
		expect(options.cache).toBe('no-store');
	});
	it('propagates forbidden responses instead of falling back to the ordinary settings endpoint', async () => {
		fetchMock.mockResolvedValueOnce(new Response('{}', { status: 403 }));
		await expect(new CalendarExportDiagnosticsApi().list('user')).rejects.toBeDefined();
		expect(fetchMock).toHaveBeenCalledTimes(1);
	});
});
