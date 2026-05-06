import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SignalRService } from './SocketService';

// Lightweight jQuery/SignalR shim for the SocketService unit tests. We only
// exercise the dispatch surface — not the underlying transport.
type ClientHandlers = Record<string, (...args: unknown[]) => void>;

interface Hub {
	client: ClientHandlers;
	server: Record<string, (...args: unknown[]) => Promise<unknown>>;
}

function installFakeJQuery() {
	const vibeUpdateHub: Hub = { client: {}, server: {} };
	const scheduleChange: Hub = { client: {}, server: {} };
	const $ = {
		connection: {
			hub: {
				url: '',
				logging: false,
				state: 1,
				start: () => ({
					done: (cb: () => void) => {
						cb();
						return { fail: () => undefined };
					},
				}),
				stop: () => undefined,
				stateChanged: () => undefined,
				reconnected: () => undefined,
				disconnected: () => undefined,
			},
			vibeUpdateHub,
			scheduleChange,
		},
		signalR: {
			connectionState: { connecting: 0, connected: 1, reconnecting: 2, disconnected: 4 },
		},
	};
	(globalThis as unknown as { window: { $: typeof $ } }).window = { $ };
	return { $, vibeUpdateHub };
}

describe('SignalRService.previewReady', () => {
	beforeEach(() => {
		installFakeJQuery();
	});

	it('binds previewReady client handler when the connection is created', () => {
		const { vibeUpdateHub } = installFakeJQuery();
		const svc = new SignalRService('user-1');
		svc.createConnection();
		expect(typeof vibeUpdateHub.client.previewReady).toBe('function');
	});

	it('dispatches incoming previewReady payloads to all subscribers', () => {
		const { vibeUpdateHub } = installFakeJQuery();
		const svc = new SignalRService('user-1');
		svc.createConnection();
		const a = vi.fn();
		const b = vi.fn();
		const idA = svc.subscribeToPreviewReady(a);
		const idB = svc.subscribeToPreviewReady(b);
		expect(typeof idA).toBe('string');
		expect(typeof idB).toBe('string');
		expect(idA).not.toBe(idB);
		const payload = {
			type: 'requestPreviewReady',
			vibeRequestId: 'r1',
			previewId: 'p1',
			scheduleDumpId: 'sd1',
			timestamp: 123,
		};
		vibeUpdateHub.client.previewReady(payload);
		expect(a).toHaveBeenCalledWith(payload);
		expect(b).toHaveBeenCalledWith(payload);
	});

	it('unsubscribeFromPreviewReady stops a single subscriber receiving further payloads', () => {
		const { vibeUpdateHub } = installFakeJQuery();
		const svc = new SignalRService('user-1');
		svc.createConnection();
		const a = vi.fn();
		const b = vi.fn();
		const idA = svc.subscribeToPreviewReady(a);
		svc.subscribeToPreviewReady(b);
		svc.unsubscribeFromPreviewReady(idA);
		vibeUpdateHub.client.previewReady({ type: 'requestPreviewReady' });
		expect(a).not.toHaveBeenCalled();
		expect(b).toHaveBeenCalledTimes(1);
	});

	it('unsubscribeAll clears all previewReady subscribers', () => {
		const { vibeUpdateHub } = installFakeJQuery();
		const svc = new SignalRService('user-1');
		svc.createConnection();
		const a = vi.fn();
		svc.subscribeToPreviewReady(a);
		svc.unsubscribeAll();
		vibeUpdateHub.client.previewReady({ type: 'requestPreviewReady' });
		expect(a).not.toHaveBeenCalled();
	});

	it('a subscriber throwing does not block other subscribers', () => {
		const { vibeUpdateHub } = installFakeJQuery();
		const svc = new SignalRService('user-1');
		svc.createConnection();
		const thrower = vi.fn(() => {
			throw new Error('boom');
		});
		const ok = vi.fn();
		svc.subscribeToPreviewReady(thrower);
		svc.subscribeToPreviewReady(ok);
		expect(() =>
			vibeUpdateHub.client.previewReady({ type: 'requestPreviewReady' })
		).not.toThrow();
		expect(ok).toHaveBeenCalledTimes(1);
	});
});
