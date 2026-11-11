import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CalendarExportDiagnosticsApi } from '../calendarExportDiagnosticsApi';
vi.mock('@/config/config_getter', () => ({ Env: { get: () => 'https://tiler.example/' } }));
vi.mock('@/services/locationService', () => ({ default: {} }));
const fetchMock = vi.fn();
describe('CalendarExportDiagnosticsApi', () => {
	beforeEach(() => {
		vi.stubGlobal('fetch', fetchMock);
		fetchMock.mockReset();
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
