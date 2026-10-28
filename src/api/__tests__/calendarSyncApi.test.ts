import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CalendarSyncApi } from '../calendarSyncApi';
import { syncStatus } from '@/services/calendarSyncClient.fixtures';

vi.mock('@/config/config_getter', () => ({ Env: { get: () => 'https://tiler.example/' } }));

describe('authenticated calendar status API', () => {
	const fetch = vi.fn<typeof globalThis.fetch>();
	beforeEach(() => {
		fetch.mockReset();
		vi.stubGlobal('fetch', fetch);
	});
	afterEach(() => vi.unstubAllGlobals());

	it('uses the existing user cookie without a user ID parameter or internal key', async () => {
		fetch.mockResolvedValueOnce(new Response(JSON.stringify({ status: syncStatus() })));
		expect(await new CalendarSyncApi().getStatus()).toEqual(syncStatus());
		const [url, options] = fetch.mock.calls[0];
		expect(url).toBe('https://tiler.example/api/CalendarSync/Status');
		expect(options).toMatchObject({ method: 'GET', credentials: 'include', cache: 'no-store' });
		expect(new Headers(options?.headers).has('X-Internal-Api-Key')).toBe(false);
	});

	it.each([null, 'disabled'])('treats unused or disabled sync as absent: %s', async (kind) => {
		fetch.mockResolvedValueOnce(
			kind === null ? new Response('{"status":null}') : new Response(null, { status: 404 })
		);
		expect(await new CalendarSyncApi().getStatus()).toBeNull();
	});

	it.each([401, 403, 503])('does not hide HTTP %s as a disabled feature', async (status) => {
		fetch.mockResolvedValueOnce(new Response(null, { status }));
		await expect(new CalendarSyncApi().getStatus()).rejects.toMatchObject({ status });
	});

	it('rejects malformed metadata rather than presenting success', async () => {
		fetch.mockResolvedValueOnce(new Response('{"status":{"state":"completed"}}'));
		await expect(new CalendarSyncApi().getStatus()).rejects.toThrow(
			'Invalid calendar synchronization status'
		);
	});
});
