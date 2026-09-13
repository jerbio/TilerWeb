import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { postBeacon } from './beacon';

const originalSendBeacon = navigator.sendBeacon;

beforeEach(() => {
	vi.unstubAllGlobals();
});

afterEach(() => {
	Object.defineProperty(navigator, 'sendBeacon', {
		value: originalSendBeacon,
		configurable: true,
		writable: true,
	});
	vi.restoreAllMocks();
});

const stubSendBeacon = (impl: ((url: string, body?: BodyInit) => boolean) | undefined) => {
	Object.defineProperty(navigator, 'sendBeacon', {
		value: impl,
		configurable: true,
		writable: true,
	});
};

const readBlob = (blob: Blob): Promise<string> =>
	new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => resolve(String(reader.result));
		reader.onerror = () => reject(reader.error);
		reader.readAsText(blob);
	});

describe('postBeacon', () => {
	it('prefers navigator.sendBeacon', async () => {
		const sendBeacon = vi.fn().mockReturnValue(true);
		stubSendBeacon(sendBeacon);
		const fetchSpy = vi.fn();
		vi.stubGlobal('fetch', fetchSpy);

		const result = await postBeacon('/api/Conversion', { eventId: 'e1' });

		expect(result).toEqual({ status: 'sent', transport: 'sendBeacon', attempts: 1 });
		expect(sendBeacon).toHaveBeenCalledTimes(1);
		expect(fetchSpy).not.toHaveBeenCalled();
	});

	it('sends the payload as a JSON blob', async () => {
		const sendBeacon = vi.fn().mockReturnValue(true);
		stubSendBeacon(sendBeacon);

		await postBeacon('/api/Conversion', { eventId: 'e1' });

		const [url, body] = sendBeacon.mock.calls[0] ?? [];
		expect(url).toBe('/api/Conversion');
		expect(body).toBeInstanceOf(Blob);
		expect((body as Blob).type).toBe('application/json');
		// jsdom's Blob has no text(); FileReader is the portable way to read it.
		await expect(readBlob(body as Blob)).resolves.toBe(JSON.stringify({ eventId: 'e1' }));
	});

	it('falls back to keepalive fetch when sendBeacon refuses the payload', async () => {
		stubSendBeacon(vi.fn().mockReturnValue(false));
		const fetchSpy = vi.fn().mockResolvedValue({ ok: true });
		vi.stubGlobal('fetch', fetchSpy);

		const result = await postBeacon('/api/Conversion', { eventId: 'e1' });

		expect(result.status).toBe('sent');
		expect(result.transport).toBe('fetch');
		expect(fetchSpy).toHaveBeenCalledTimes(1);
		expect(fetchSpy.mock.calls[0]?.[1]).toMatchObject({
			method: 'POST',
			keepalive: true,
			credentials: 'include',
		});
	});

	it('falls back to fetch when sendBeacon is unavailable', async () => {
		stubSendBeacon(undefined);
		const fetchSpy = vi.fn().mockResolvedValue({ ok: true });
		vi.stubGlobal('fetch', fetchSpy);

		const result = await postBeacon('/api/Conversion', { eventId: 'e1' });

		expect(result.transport).toBe('fetch');
		expect(result.status).toBe('sent');
	});

	it('retries a failed fetch up to the attempt limit', async () => {
		stubSendBeacon(undefined);
		const fetchSpy = vi.fn().mockRejectedValue(new Error('offline'));
		vi.stubGlobal('fetch', fetchSpy);

		const result = await postBeacon(
			'/api/Conversion',
			{ eventId: 'e1' },
			{ maxAttempts: 3, retryDelayMs: 0 }
		);

		expect(fetchSpy).toHaveBeenCalledTimes(3);
		expect(result.status).toBe('error');
		expect(result.attempts).toBe(3);
	});

	it('stops retrying as soon as a attempt succeeds', async () => {
		stubSendBeacon(undefined);
		const fetchSpy = vi
			.fn()
			.mockRejectedValueOnce(new Error('offline'))
			.mockResolvedValue({ ok: true });
		vi.stubGlobal('fetch', fetchSpy);

		const result = await postBeacon(
			'/api/Conversion',
			{ eventId: 'e1' },
			{ maxAttempts: 3, retryDelayMs: 0 }
		);

		expect(fetchSpy).toHaveBeenCalledTimes(2);
		expect(result).toMatchObject({ status: 'sent', attempts: 2 });
	});

	it('treats a non-ok response as a failure worth retrying', async () => {
		stubSendBeacon(undefined);
		const fetchSpy = vi.fn().mockResolvedValue({ ok: false, status: 503 });
		vi.stubGlobal('fetch', fetchSpy);

		const result = await postBeacon(
			'/api/Conversion',
			{ eventId: 'e1' },
			{ maxAttempts: 2, retryDelayMs: 0 }
		);

		expect(fetchSpy).toHaveBeenCalledTimes(2);
		expect(result.status).toBe('error');
	});

	it('never rejects, so a tracking failure cannot break a caller', async () => {
		stubSendBeacon(() => {
			throw new Error('boom');
		});
		vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('also boom')));

		await expect(
			postBeacon('/api/Conversion', { eventId: 'e1' }, { maxAttempts: 1, retryDelayMs: 0 })
		).resolves.toMatchObject({ status: 'error' });
	});
});
