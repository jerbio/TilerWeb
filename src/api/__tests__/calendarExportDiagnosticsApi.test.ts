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
