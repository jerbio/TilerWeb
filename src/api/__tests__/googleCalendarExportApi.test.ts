import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GoogleCalendarExportApi } from '../googleCalendarExportApi';
vi.mock('@/config/config_getter', () => ({ Env: { get: () => 'https://tiler.example/' } }));
vi.mock('@/services/locationService', () => ({ default: {} }));
const response = {
	id: 'export',
	authenticationId: 'account',
	enabled: true,
	horizonDays: 7,
};
const fetchMock = vi.fn();
describe('GoogleCalendarExportApi', () => {
	beforeEach(() => {
		vi.stubGlobal('fetch', fetchMock);
		fetchMock.mockReset();
	});
	it('sends an explicit account opt-in without a caller-supplied user or calendar destination', async () => {
		fetchMock.mockResolvedValue(
			new Response(JSON.stringify({ export: response }), { status: 200 })
		);
		expect(await new GoogleCalendarExportApi().configure('account', true, 7)).toEqual(response);
		const [url, options] = fetchMock.mock.calls[0];
		expect(url).toBe('https://tiler.example/api/CalendarSync/GoogleExport');
		expect(options.method).toBe('POST');
		expect(JSON.parse(options.body)).toEqual({
			authenticationId: 'account',
			enabled: true,
			horizonDays: 7,
		});
	});
	it('treats disabled rollout as unavailable and rejects mismatched account responses', async () => {
		fetchMock.mockResolvedValueOnce(new Response('', { status: 404 }));
		expect(await new GoogleCalendarExportApi().list()).toBeNull();
		fetchMock.mockResolvedValueOnce(
			new Response(JSON.stringify({ export: { ...response, authenticationId: 'another' } }), {
				status: 200,
			})
		);
		await expect(new GoogleCalendarExportApi().configure('account', true, 7)).rejects.toThrow(
			'destination'
		);
	});
});
