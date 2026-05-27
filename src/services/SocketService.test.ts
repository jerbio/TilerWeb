import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SignalRService, SignalRConnectionManager, Hubs } from './SocketService';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

type ClientMap = Record<string, (...args: unknown[]) => void>;
type ServerMap = Record<string, ReturnType<typeof vi.fn>>;
interface HubProxy {
	client: ClientMap;
	server: ServerMap;
}

interface MockSignalR {
	startCount: number;
	stopCount: number;
	stateChangedHandlers: Array<(c: { oldState: number; newState: number }) => void>;
	reconnectedHandlers: Array<() => void>;
	disconnectedHandlers: Array<() => void>;
	hubProxies: Record<string, HubProxy>;
	// Snapshot of which client method names existed on each hub proxy at the
	// instant `hub.start()` was last invoked. jQuery SignalR uses these to
	// decide which hubs the connection subscribes to during negotiation.
	clientMethodsAtStart: Record<string, string[]>;
	simulateServerPush(hub: string, method: string, data: unknown): void;
	simulateReconnect(): void;
	getProxy(hub: string): HubProxy;
}

const CONNECTION_STATE = {
	connecting: 0,
	connected: 1,
	reconnecting: 2,
	disconnected: 4,
};

function installMockSignalR(): MockSignalR {
	const ctx: MockSignalR = {
		startCount: 0,
		stopCount: 0,
		stateChangedHandlers: [],
		reconnectedHandlers: [],
		disconnectedHandlers: [],
		hubProxies: {},
		clientMethodsAtStart: {},
		simulateServerPush(hub, method, data) {
			const proxy = ctx.hubProxies[hub];
			const fn = proxy?.client?.[method];
			if (fn) fn(data);
		},
		simulateReconnect() {
			ctx.reconnectedHandlers.forEach((h) => h());
		},
		getProxy(hub) {
			return ctx.hubProxies[hub];
		},
	};

	const hub = {
		url: '',
		logging: false,
		state: CONNECTION_STATE.disconnected,
		start: vi.fn((_opts?: unknown) => {
			ctx.startCount++;
			// Snapshot which client method names exist on each hub proxy at
			// the moment start() fires — this is what jQuery SignalR uses to
			// negotiate hub subscriptions with the server.
			ctx.clientMethodsAtStart = {};
			for (const hubName of Object.keys(ctx.hubProxies)) {
				ctx.clientMethodsAtStart[hubName] = Object.keys(ctx.hubProxies[hubName].client);
			}
			hub.state = CONNECTION_STATE.connected;
			return {
				done(cb: () => void) {
					cb();
					return { fail(_failCb: (e: Error) => void) {} };
				},
			};
		}),
		stop: vi.fn(() => {
			ctx.stopCount++;
			hub.state = CONNECTION_STATE.disconnected;
		}),
		stateChanged: (cb: (c: { oldState: number; newState: number }) => void) => {
			ctx.stateChangedHandlers.push(cb);
		},
		reconnected: (cb: () => void) => {
			ctx.reconnectedHandlers.push(cb);
		},
		disconnected: (cb: () => void) => {
			ctx.disconnectedHandlers.push(cb);
		},
	};

	const connection: Record<string, unknown> = { hub };

	// Use a Proxy so any hub name accessed lazily auto-creates a proxy with
	// empty client/server maps — mirrors how jQuery SignalR exposes generated proxies.
	const connectionProxy = new Proxy(connection, {
		get(target, prop: string) {
			if (prop in target) return target[prop];
			const newProxy: HubProxy = {
				client: {},
				server: new Proxy({} as ServerMap, {
					get(srvTarget, srvProp: string) {
						if (!(srvProp in srvTarget)) {
							srvTarget[srvProp] = vi.fn(() => Promise.resolve(undefined));
						}
						return srvTarget[srvProp];
					},
				}),
			};
			target[prop] = newProxy;
			ctx.hubProxies[prop] = newProxy;
			return newProxy;
		},
	});

	(window as unknown as { $: unknown }).$ = {
		connection: connectionProxy,
		signalR: { connectionState: CONNECTION_STATE },
	};

	return ctx;
}

function uninstallMockSignalR() {
	delete (window as unknown as { $?: unknown }).$;
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

let mock: MockSignalR;

beforeEach(() => {
	SignalRConnectionManager.__resetForTests();
	mock = installMockSignalR();
});

afterEach(() => {
	uninstallMockSignalR();
});

// ---------------------------------------------------------------------------
// A. Connection lifecycle
// ---------------------------------------------------------------------------

describe('SignalRService — connection lifecycle', () => {
	it('starts the hub exactly once when two services connect with the same userId', () => {
		const a = new SignalRService('user-1');
		const b = new SignalRService('user-1');
		a.createConnection();
		b.createConnection();
		expect(mock.startCount).toBe(1);
	});

	it('does not stop the hub when one of multiple consumers disposes', () => {
		const a = new SignalRService('user-1');
		const b = new SignalRService('user-1');
		a.createConnection();
		b.createConnection();
		a.dispose();
		expect(mock.stopCount).toBe(0);
	});

	it('stops the hub when the last consumer disposes', () => {
		const a = new SignalRService('user-1');
		const b = new SignalRService('user-1');
		a.createConnection();
		b.createConnection();
		a.dispose();
		b.dispose();
		expect(mock.stopCount).toBe(1);
	});

	it('createConnection on the same instance is idempotent', () => {
		const a = new SignalRService('user-1');
		a.createConnection();
		a.createConnection();
		const b = new SignalRService('user-1');
		b.createConnection();
		// a should have acquired only once; disposing a once should leave b active
		a.dispose();
		expect(mock.stopCount).toBe(0);
		b.dispose();
		expect(mock.stopCount).toBe(1);
	});
});

// ---------------------------------------------------------------------------
// B. Generic subscription fan-out (the bug under test)
// ---------------------------------------------------------------------------

describe('SignalRService — generic subscription fan-out', () => {
	it('routes scheduleChange pushes only to scheduleChange subscribers', () => {
		const a = new SignalRService('user-1');
		const b = new SignalRService('user-1');
		a.createConnection();
		b.createConnection();
		const cbA = vi.fn();
		const cbB = vi.fn();
		a.subscribe(Hubs.ScheduleChange.name, Hubs.ScheduleChange.events.RefreshData, cbA);
		b.subscribe(Hubs.VibeUpdate.name, Hubs.VibeUpdate.events.RefreshData, cbB);

		mock.simulateServerPush(Hubs.ScheduleChange.name, Hubs.ScheduleChange.events.RefreshData, {
			kind: 'schedule',
		});

		expect(cbA).toHaveBeenCalledTimes(1);
		expect(cbA).toHaveBeenCalledWith({ kind: 'schedule' });
		expect(cbB).not.toHaveBeenCalled();
	});

	it('routes vibeUpdateHub pushes only to vibe subscribers', () => {
		const a = new SignalRService('user-1');
		const b = new SignalRService('user-1');
		a.createConnection();
		b.createConnection();
		const cbA = vi.fn();
		const cbB = vi.fn();
		a.subscribe(Hubs.ScheduleChange.name, Hubs.ScheduleChange.events.RefreshData, cbA);
		b.subscribe(Hubs.VibeUpdate.name, Hubs.VibeUpdate.events.RefreshData, cbB);

		mock.simulateServerPush(Hubs.VibeUpdate.name, Hubs.VibeUpdate.events.RefreshData, {
			kind: 'vibe',
		});

		expect(cbB).toHaveBeenCalledTimes(1);
		expect(cbA).not.toHaveBeenCalled();
	});

	it('subscription order does not matter (B subscribes before A connects)', () => {
		const b = new SignalRService('user-1');
		b.createConnection();
		const cbB = vi.fn();
		b.subscribe(Hubs.VibeUpdate.name, Hubs.VibeUpdate.events.RefreshData, cbB);

		const a = new SignalRService('user-1');
		a.createConnection();
		const cbA = vi.fn();
		a.subscribe(Hubs.ScheduleChange.name, Hubs.ScheduleChange.events.RefreshData, cbA);

		mock.simulateServerPush(Hubs.ScheduleChange.name, Hubs.ScheduleChange.events.RefreshData, {
			x: 1,
		});
		mock.simulateServerPush(Hubs.VibeUpdate.name, Hubs.VibeUpdate.events.RefreshData, { x: 2 });

		expect(cbA).toHaveBeenCalledWith({ x: 1 });
		expect(cbB).toHaveBeenCalledWith({ x: 2 });
	});
});

// ---------------------------------------------------------------------------
// C. Multi-subscriber on same hub/method
// ---------------------------------------------------------------------------

describe('SignalRService — multiple subscribers on same hub/method', () => {
	it('fans out to all subscribers on the same (hub, method)', () => {
		const a = new SignalRService('user-1');
		const b = new SignalRService('user-1');
		a.createConnection();
		b.createConnection();
		const cb1 = vi.fn();
		const cb2 = vi.fn();
		a.subscribe(Hubs.ScheduleChange.name, Hubs.ScheduleChange.events.RefreshData, cb1);
		b.subscribe(Hubs.ScheduleChange.name, Hubs.ScheduleChange.events.RefreshData, cb2);

		mock.simulateServerPush(
			Hubs.ScheduleChange.name,
			Hubs.ScheduleChange.events.RefreshData,
			{}
		);

		expect(cb1).toHaveBeenCalledTimes(1);
		expect(cb2).toHaveBeenCalledTimes(1);
	});

	it('unsubscribing one leaves the other firing', () => {
		const a = new SignalRService('user-1');
		const b = new SignalRService('user-1');
		a.createConnection();
		b.createConnection();
		const cb1 = vi.fn();
		const cb2 = vi.fn();
		const h1 = a.subscribe(
			Hubs.ScheduleChange.name,
			Hubs.ScheduleChange.events.RefreshData,
			cb1
		);
		b.subscribe(Hubs.ScheduleChange.name, Hubs.ScheduleChange.events.RefreshData, cb2);

		a.unsubscribe(h1);

		mock.simulateServerPush(
			Hubs.ScheduleChange.name,
			Hubs.ScheduleChange.events.RefreshData,
			{}
		);

		expect(cb1).not.toHaveBeenCalled();
		expect(cb2).toHaveBeenCalledTimes(1);
	});
});

// ---------------------------------------------------------------------------
// D. Cleanup correctness
// ---------------------------------------------------------------------------

describe('SignalRService — cleanup', () => {
	it('dispose removes only the calling instance subscriptions', () => {
		const a = new SignalRService('user-1');
		const b = new SignalRService('user-1');
		a.createConnection();
		b.createConnection();
		const cbA = vi.fn();
		const cbB = vi.fn();
		a.subscribe(Hubs.ScheduleChange.name, Hubs.ScheduleChange.events.RefreshData, cbA);
		b.subscribe(Hubs.ScheduleChange.name, Hubs.ScheduleChange.events.RefreshData, cbB);

		a.dispose();

		mock.simulateServerPush(
			Hubs.ScheduleChange.name,
			Hubs.ScheduleChange.events.RefreshData,
			{}
		);
		expect(cbA).not.toHaveBeenCalled();
		expect(cbB).toHaveBeenCalledTimes(1);
	});

	it('dispose is safe to call twice without over-decrementing refcount', () => {
		const a = new SignalRService('user-1');
		const b = new SignalRService('user-1');
		a.createConnection();
		b.createConnection();
		a.dispose();
		a.dispose(); // second call should be no-op
		expect(mock.stopCount).toBe(0);
		b.dispose();
		expect(mock.stopCount).toBe(1);
	});

	it('unsubscribe with a stale handle is a no-op', () => {
		const a = new SignalRService('user-1');
		a.createConnection();
		const cb = vi.fn();
		const h = a.subscribe(Hubs.ScheduleChange.name, Hubs.ScheduleChange.events.RefreshData, cb);
		a.unsubscribe(h);
		expect(() => a.unsubscribe(h)).not.toThrow();
	});
});

// ---------------------------------------------------------------------------
// E. Reconnect
// ---------------------------------------------------------------------------

describe('SignalRService — reconnect', () => {
	it('rejoins the user group once on reconnect (not once per consumer)', () => {
		const a = new SignalRService('user-1');
		const b = new SignalRService('user-1');
		a.createConnection();
		b.createConnection();

		const proxy = mock.getProxy(Hubs.VibeUpdate.name);
		// joinUserGroup should have been invoked once on initial start
		expect(proxy.server[Hubs.VibeUpdate.server.JoinUserGroup]).toHaveBeenCalledTimes(1);

		mock.simulateReconnect();

		expect(proxy.server[Hubs.VibeUpdate.server.JoinUserGroup]).toHaveBeenCalledTimes(2);
	});

	it('joins user group for every distinct userId across consumers', () => {
		// Two consumers with different userIds — e.g. useScheduleSocket using
		// the logged-in userId and chat using the anonymous userId. Each user
		// must be joined so the server pushes to both groups.
		const a = new SignalRService('user-logged-in');
		const b = new SignalRService('user-anonymous');
		a.createConnection();
		b.createConnection();

		const proxy = mock.getProxy(Hubs.VibeUpdate.name);
		const joinFn = proxy.server[Hubs.VibeUpdate.server.JoinUserGroup];

		expect(joinFn).toHaveBeenCalledTimes(2);
		const joinedArgs = joinFn.mock.calls.map((c) => c[0]);
		expect(joinedArgs).toContain('user-logged-in');
		expect(joinedArgs).toContain('user-anonymous');
	});

	it('does not re-join the same userId when a second consumer acquires with it', () => {
		const a = new SignalRService('user-1');
		const b = new SignalRService('user-1');
		a.createConnection();
		b.createConnection();

		const proxy = mock.getProxy(Hubs.VibeUpdate.name);
		expect(proxy.server[Hubs.VibeUpdate.server.JoinUserGroup]).toHaveBeenCalledTimes(1);
	});

	it('rejoins every active user group on reconnect', () => {
		const a = new SignalRService('user-A');
		const b = new SignalRService('user-B');
		a.createConnection();
		b.createConnection();

		const proxy = mock.getProxy(Hubs.VibeUpdate.name);
		const joinFn = proxy.server[Hubs.VibeUpdate.server.JoinUserGroup];

		expect(joinFn).toHaveBeenCalledTimes(2);

		mock.simulateReconnect();

		expect(joinFn).toHaveBeenCalledTimes(4);
		const allArgs = joinFn.mock.calls.map((c) => c[0]);
		expect(allArgs.filter((u) => u === 'user-A')).toHaveLength(2);
		expect(allArgs.filter((u) => u === 'user-B')).toHaveLength(2);
	});

	it('stops joining a user group after the last consumer for that userId disposes', () => {
		const a = new SignalRService('user-A');
		const b = new SignalRService('user-B');
		a.createConnection();
		b.createConnection();

		const proxy = mock.getProxy(Hubs.VibeUpdate.name);
		const joinFn = proxy.server[Hubs.VibeUpdate.server.JoinUserGroup];
		joinFn.mockClear();

		a.dispose();
		mock.simulateReconnect();

		// Only user-B remains; only it should be rejoined.
		expect(joinFn).toHaveBeenCalledTimes(1);
		expect(joinFn.mock.calls[0][0]).toBe('user-B');
	});
});

// ---------------------------------------------------------------------------
// F. New hub without code changes
// ---------------------------------------------------------------------------

describe('SignalRService — extensibility', () => {
	it('supports subscribing to an arbitrary hub/method never referenced in source', () => {
		const a = new SignalRService('user-1');
		a.createConnection();
		const cb = vi.fn();
		a.subscribe('presenceHub', 'userOnline', cb);

		mock.simulateServerPush('presenceHub', 'userOnline', { user: 'x' });

		expect(cb).toHaveBeenCalledWith({ user: 'x' });
	});
});

// ---------------------------------------------------------------------------
// G. Server invocation
// ---------------------------------------------------------------------------

describe('SignalRService — invoke', () => {
	it('invokes a server method on the named hub with args', async () => {
		const a = new SignalRService('user-1');
		a.createConnection();
		await a.invoke(Hubs.VibeUpdate.name, 'someServerMethod', 'arg-1', 42);
		const proxy = mock.getProxy(Hubs.VibeUpdate.name);
		expect(proxy.server['someServerMethod']).toHaveBeenCalledWith('arg-1', 42);
	});

	it('returns undefined and does not throw when disconnected', () => {
		const a = new SignalRService('user-1');
		// no createConnection called
		expect(() => a.invoke(Hubs.VibeUpdate.name, 'method', 'x')).not.toThrow();
		expect(a.invoke(Hubs.VibeUpdate.name, 'method', 'x')).toBeUndefined();
	});
});

// ---------------------------------------------------------------------------
// H. Defensive
// ---------------------------------------------------------------------------

describe('SignalRService — defensive', () => {
	it('createConnection without window.$ logs an error and does not throw', () => {
		uninstallMockSignalR();
		const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
		const a = new SignalRService('user-1');
		expect(() => a.createConnection()).not.toThrow();
		expect(errSpy).toHaveBeenCalled();
		errSpy.mockRestore();
	});
});

// ---------------------------------------------------------------------------
// I. Hubs constants
// ---------------------------------------------------------------------------

describe('Hubs constants', () => {
	it('preserves the server-side method names (including the intentional typo)', () => {
		expect(Hubs.ScheduleChange.name).toBe('scheduleChange');
		expect(Hubs.ScheduleChange.events.RefreshData).toBe('refereshDataFromSockets');
		expect(Hubs.VibeUpdate.name).toBe('vibeUpdateHub');
		expect(Hubs.VibeUpdate.events.RefreshData).toBe('refreshDataFromSockets');
	});
});

// ---------------------------------------------------------------------------
// J. Start lifecycle — client handlers must be registered before .start()
// ---------------------------------------------------------------------------
//
// jQuery SignalR negotiates which hubs the connection subscribes to based on
// the client methods present on each hub proxy AT THE MOMENT `.start()` is
// invoked. If we call .start() before registering any handlers, the server
// never pushes vibe/schedule events to this connection at all — which is the
// root cause of "chat UI not updating with chat updates".

describe('SignalRService — hub handlers wired before .start()', () => {
	it('registers VibeUpdate.RefreshData on the proxy before start() is called', () => {
		const a = new SignalRService('user-1');
		a.createConnection();
		// chat would synchronously subscribe right after createConnection().
		a.subscribe(Hubs.VibeUpdate.name, Hubs.VibeUpdate.events.RefreshData, vi.fn());

		expect(mock.startCount).toBe(1);
		expect(mock.clientMethodsAtStart[Hubs.VibeUpdate.name]).toContain(
			Hubs.VibeUpdate.events.RefreshData
		);
	});

	it('registers ScheduleChange.RefreshData on the proxy before start() is called', () => {
		const a = new SignalRService('user-1');
		a.createConnection();
		a.subscribe(Hubs.ScheduleChange.name, Hubs.ScheduleChange.events.RefreshData, vi.fn());

		expect(mock.clientMethodsAtStart[Hubs.ScheduleChange.name]).toContain(
			Hubs.ScheduleChange.events.RefreshData
		);
	});

	it('pre-wires all known Hubs catalog events so server pushes are negotiated', () => {
		// Even if no consumer subscribes yet, every event in the Hubs catalog
		// should be present on its proxy at start() time so the connection
		// negotiates subscriptions for them. Late subscribe() calls then fan
		// out through the already-wired dispatcher.
		const a = new SignalRService('user-1');
		a.createConnection();

		expect(mock.clientMethodsAtStart[Hubs.VibeUpdate.name]).toContain(
			Hubs.VibeUpdate.events.RefreshData
		);
		expect(mock.clientMethodsAtStart[Hubs.ScheduleChange.name]).toContain(
			Hubs.ScheduleChange.events.RefreshData
		);
	});

	it('a subscriber registered after createConnection still receives pushes', () => {
		// Reproduces the chat-not-updating scenario end-to-end.
		const chat = new SignalRService('anonymous-user');
		chat.createConnection();
		const cb = vi.fn();
		chat.subscribe(Hubs.VibeUpdate.name, Hubs.VibeUpdate.events.RefreshData, cb);

		mock.simulateServerPush(Hubs.VibeUpdate.name, Hubs.VibeUpdate.events.RefreshData, {
			data: { vibe: { status: 'process_action_start' } },
		});

		expect(cb).toHaveBeenCalledTimes(1);
		expect(cb).toHaveBeenCalledWith({
			data: { vibe: { status: 'process_action_start' } },
		});
	});
});
