// For .NET Framework SignalR, we rely on the jQuery-based SignalR client.
// The jQuery SignalR client exposes a single global connection
// (`window.$.connection.hub`) and one shared proxy per hub
// (`window.$.connection.<hubName>`). Each `client.<method>` handler is a plain
// property assignment, so naive per-component setup causes the last writer to
// overwrite earlier subscribers.
//
// This module provides:
//   1. A process-level `SignalRConnectionManager` that owns the single hub
//      connection, ref-counts active consumers, and fans out incoming pushes
//      to all subscribers of a given (hub, clientMethod) pair.
//   2. A per-consumer `SignalRService` facade that exposes a generic
//      subscribe/unsubscribe/invoke API and tracks only its own handles so
//      that disposing one consumer never affects another.

import { Env } from '@/config/config_getter';

// ---------------------------------------------------------------------------
// jQuery SignalR type surface (minimal)
// ---------------------------------------------------------------------------

interface SignalRConnectionState {
	connecting: number;
	connected: number;
	reconnecting: number;
	disconnected: number;
}

interface SignalRHubProxy {
	client: Record<string, (...args: unknown[]) => void>;
	server: Record<string, (...args: unknown[]) => Promise<unknown>>;
}

interface SignalRConnection {
	url: string;
	logging: boolean;
	state: number;
	start(options?: { transport: string[] }): {
		done(callback: () => void): { fail(callback: (error: Error) => void): void };
	};
	stop(): void;
	stateChanged(callback: (change: { oldState: number; newState: number }) => void): void;
	reconnected(callback: () => void): void;
	disconnected(callback: () => void): void;
}

interface JQuerySignalR {
	connectionState: SignalRConnectionState;
}

interface JQueryConnection {
	hub: SignalRConnection;
	[hubName: string]: SignalRHubProxy | SignalRConnection | undefined;
}

interface JQueryWithSignalR {
	connection: JQueryConnection;
	signalR: JQuerySignalR;
}

declare global {
	interface Window {
		$: JQueryWithSignalR;
	}
}

// ---------------------------------------------------------------------------
// Hub catalog
// ---------------------------------------------------------------------------

// Centralized names for known hubs. Adding a new hub does NOT require any
// changes to SignalRService / SignalRConnectionManager — just add an entry
// here (or pass raw strings to subscribe()).
//
// NOTE: `ScheduleChange.events.RefreshData` intentionally keeps the server's
// existing typo (`refereshDataFromSockets`); changing it would break the
// jQuery-generated proxy method binding.
export const Hubs = {
	VibeUpdate: {
		name: 'vibeUpdateHub',
		events: {
			RefreshData: 'refreshDataFromSockets',
			PreviewReady: 'previewReady',
		},
		server: {
			JoinUserGroup: 'joinUserGroup',
		},
	},
	ScheduleChange: {
		name: 'scheduleChange',
		events: {
			RefreshData: 'refereshDataFromSockets',
		},
	},
} as const;

// ---------------------------------------------------------------------------
// Subscription handle
// ---------------------------------------------------------------------------

export interface SubscriptionHandle {
	id: string;
	hub: string;
	method: string;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function generateId(): string {
	return Math.random().toString(36).slice(2, 11);
}

function subKey(hub: string, method: string): string {
	return `${hub}::${method}`;
}

function isSignalRAvailable(): boolean {
	return (
		typeof window !== 'undefined' &&
		typeof window.$ !== 'undefined' &&
		typeof window.$.connection !== 'undefined'
	);
}

// ---------------------------------------------------------------------------
// Diagnostic logging
// ---------------------------------------------------------------------------
//
// All logs are emitted with the `[SignalR]` prefix so they can be filtered in
// the browser console. Set `window.__SIGNALR_DEBUG__ = false` to silence.
declare global {
	interface Window {
		__SIGNALR_DEBUG__?: boolean;
	}
}

function sigLog(...args: unknown[]): void {
	if (typeof window !== 'undefined' && window.__SIGNALR_DEBUG__ === false) return;
	console.log('[SignalR]', ...args);
}

function sigWarn(...args: unknown[]): void {
	console.warn('[SignalR]', ...args);
}

function sigError(...args: unknown[]): void {
	console.error('[SignalR]', ...args);
}

// ---------------------------------------------------------------------------
// SignalRConnectionManager
// ---------------------------------------------------------------------------

export class SignalRConnectionManager {
	private static _instance: SignalRConnectionManager | null = null;

	static get(): SignalRConnectionManager {
		if (!this._instance) {
			this._instance = new SignalRConnectionManager();
		}
		return this._instance;
	}

	/** Test-only: drop the singleton so each test starts fresh. */
	static __resetForTests(): void {
		this._instance = null;
	}

	private refCount = 0;
	private userRefCounts = new Map<string, number>();
	private pendingJoins: string[] = [];
	private started = false;
	private startInFlight = false;
	private readonly baseUrl = Env.get('BASE_URL');
	private subscriptions = new Map<string, Map<string, (data: unknown) => void>>();
	private wiredHandlers = new Set<string>();
	private lifecycleWired = false;

	/** Acquire a reference to the shared connection. Starts the hub on first
	 *  acquire; subsequent acquires only bump the ref count. Each unique
	 *  userId triggers its own joinUserGroup call so the server pushes to
	 *  every active user's group. */
	acquire(userId: string): void {
		this.refCount++;
		const prev = this.userRefCounts.get(userId) ?? 0;
		this.userRefCounts.set(userId, prev + 1);
		const isNewUser = prev === 0;

		sigLog('acquire()', {
			userId,
			refCount: this.refCount,
			userRefCount: prev + 1,
			isNewUser,
			started: this.started,
			startInFlight: this.startInFlight,
		});

		if (!this.started && !this.startInFlight) {
			if (isNewUser) this.pendingJoins.push(userId);
			this.startHub();
			return;
		}

		if (isNewUser) {
			if (this.started) {
				sigLog('acquire() -> joinUserGroup (hub already started)', { userId });
				this.invoke(Hubs.VibeUpdate.name, Hubs.VibeUpdate.server.JoinUserGroup, userId);
			} else {
				// Hub is still starting; queue the join for the .done callback.
				sigLog('acquire() -> queue pendingJoin (hub starting)', { userId });
				this.pendingJoins.push(userId);
			}
		}
	}

	/** Release a reference. Decrements that user's join refcount; when the
	 *  last reference for a userId is released, that user is removed from
	 *  the rejoin set. Stops the hub when the last consumer overall leaves. */
	release(userId?: string): void {
		if (this.refCount === 0) {
			sigWarn('release() called with refCount=0 (no-op)', { userId });
			return;
		}
		this.refCount--;

		if (userId !== undefined) {
			const prev = this.userRefCounts.get(userId);
			if (prev !== undefined) {
				if (prev <= 1) this.userRefCounts.delete(userId);
				else this.userRefCounts.set(userId, prev - 1);
			}
		}

		sigLog('release()', {
			userId,
			refCount: this.refCount,
			remainingUsers: Array.from(this.userRefCounts.keys()),
		});

		if (this.refCount === 0 && this.started) {
			sigLog('release() -> stopping hub (last consumer released)');
			try {
				if (isSignalRAvailable()) {
					window.$.connection.hub.stop();
				}
			} catch (err) {
				sigError('Error stopping SignalR connection:', err);
			}
			this.started = false;
			this.userRefCounts.clear();
			this.pendingJoins = [];
		}
	}

	/** Register a callback. Wires the client handler on first subscription
	 *  for a given (hub, method). Returns an id used to unsubscribe. */
	subscribe(hub: string, method: string, cb: (data: unknown) => void): string {
		const key = subKey(hub, method);
		let bucket = this.subscriptions.get(key);
		if (!bucket) {
			bucket = new Map();
			this.subscriptions.set(key, bucket);
		}
		const id = generateId();
		bucket.set(id, cb);
		sigLog('subscribe()', {
			hub,
			method,
			id,
			bucketSize: bucket.size,
			alreadyWired: this.wiredHandlers.has(key),
			started: this.started,
		});
		this.ensureClientHandlerWired(hub, method, key);
		return id;
	}

	unsubscribe(hub: string, method: string, id: string): void {
		const key = subKey(hub, method);
		const bucket = this.subscriptions.get(key);
		if (!bucket) {
			sigLog('unsubscribe() no bucket', { hub, method, id });
			return;
		}
		const existed = bucket.delete(id);
		sigLog('unsubscribe()', {
			hub,
			method,
			id,
			existed,
			bucketSize: bucket.size,
		});
	}

	/** Invoke a server method on the named hub. */
	invoke(hub: string, method: string, ...args: unknown[]): Promise<unknown> | undefined {
		if (!this.isConnected()) {
			sigWarn('invoke() skipped — connection not established', { hub, method, args });
			return undefined;
		}
		const proxy = this.getHubProxy(hub);
		const fn = proxy?.server?.[method];
		if (!fn) {
			sigWarn(`invoke() server method '${method}' not available on hub '${hub}'`, {
				availableServerMethods: proxy ? Object.keys(proxy.server ?? {}) : null,
			});
			return undefined;
		}
		sigLog('invoke()', { hub, method, args });
		try {
			return fn(...args);
		} catch (err) {
			sigError(`Error invoking ${hub}.${method}:`, err);
			return undefined;
		}
	}

	isConnected(): boolean {
		if (!isSignalRAvailable()) return false;
		return window.$.connection.hub.state === window.$.signalR.connectionState.connected;
	}

	// ----- internals -----

	private ensureClientHandlerWired(hub: string, method: string, key: string): void {
		if (this.wiredHandlers.has(key)) {
			sigLog('ensureClientHandlerWired() already wired', { hub, method });
			return;
		}
		if (!isSignalRAvailable()) {
			sigWarn('ensureClientHandlerWired() SignalR not available', { hub, method });
			return;
		}
		const proxy = this.getHubProxy(hub);
		if (!proxy) {
			sigError(`Hub proxy '${hub}' is not available`, {
				hub,
				method,
				availableHubs: Object.keys(window.$.connection ?? {}).filter((k) => k !== 'hub'),
			});
			return;
		}
		proxy.client[method] = (...args: unknown[]) => {
			const data = args.length <= 1 ? args[0] : args;
			const bucket = this.subscriptions.get(key);
			sigLog('<-- server push', {
				hub,
				method,
				bucketSize: bucket?.size ?? 0,
				data,
			});
			if (!bucket || bucket.size === 0) {
				sigWarn('<-- server push DROPPED (no subscribers)', { hub, method });
				return;
			}
			// Copy values to avoid mutation-during-iteration issues if a callback
			// unsubscribes itself.
			Array.from(bucket.values()).forEach((cb) => {
				try {
					cb(data);
				} catch (err) {
					sigError(`Subscriber for ${hub}.${method} threw:`, err);
				}
			});
		};
		this.wiredHandlers.add(key);
		sigLog('ensureClientHandlerWired() WIRED', { hub, method });
	}

	private getHubProxy(hub: string): SignalRHubProxy | undefined {
		if (!isSignalRAvailable()) return undefined;
		const candidate = window.$.connection[hub];
		if (!candidate || (candidate as SignalRConnection).start) return undefined;
		return candidate as SignalRHubProxy;
	}

	private startHub(): void {
		if (!isSignalRAvailable()) {
			sigError('jQuery and SignalR are required for .NET Framework SignalR');
			return;
		}

		this.startInFlight = true;

		// Configure once
		window.$.connection.hub.url = `${this.baseUrl}signalr`;
		window.$.connection.hub.logging = true;

		sigLog('startHub() configuring', {
			url: window.$.connection.hub.url,
			lifecycleWired: this.lifecycleWired,
		});

		// Wire lifecycle handlers exactly once
		if (!this.lifecycleWired) {
			window.$.connection.hub.stateChanged(
				(change: { oldState: number; newState: number }) => {
					sigLog('stateChanged', {
						oldState: change.oldState,
						newState: change.newState,
					});
				}
			);
			window.$.connection.hub.reconnected(() => {
				sigLog('reconnected -> rejoining user groups', {
					users: Array.from(this.userRefCounts.keys()),
				});
				this.rejoinUserGroup();
			});
			window.$.connection.hub.disconnected(() => {
				sigWarn('disconnected', { refCount: this.refCount });
				// Attempt to restart connection after 5 seconds if we still have
				// active consumers.
				setTimeout(() => {
					if (
						this.refCount > 0 &&
						isSignalRAvailable() &&
						window.$.connection.hub.state ===
							window.$.signalR.connectionState.disconnected
					) {
						sigLog('disconnected -> auto-restart .start()');
						window.$.connection.hub.start();
					}
				}, 5000);
			});
			this.lifecycleWired = true;
		}

		// jQuery SignalR negotiates hub subscriptions during `.start()` based
		// on which `client.<method>` handlers exist on each hub proxy at that
		// moment. We pre-wire the fan-out dispatcher for every event in the
		// Hubs catalog so the connection subscribes to those hubs even before
		// any consumer calls subscribe(). Late subscribe() calls then attach
		// to the already-wired dispatcher.
		this.prewireCatalogHandlers();

		// Snapshot what jQuery SignalR will negotiate at .start() time.
		const snapshot: Record<string, string[]> = {};
		for (const hubKey of Object.keys(window.$.connection)) {
			if (hubKey === 'hub') continue;
			const proxy = window.$.connection[hubKey] as SignalRHubProxy | undefined;
			if (proxy && proxy.client) {
				snapshot[hubKey] = Object.keys(proxy.client);
			}
		}
		sigLog('startHub() about to call .start() — hub client methods at start:', snapshot);

		try {
			window.$.connection.hub
				.start({
					transport: ['webSockets', 'serverSentEvents', 'longPolling'],
				})
				.done(() => {
					this.started = true;
					this.startInFlight = false;
					const toJoin = this.pendingJoins;
					this.pendingJoins = [];
					sigLog('start().done() — connection established', {
						state: window.$.connection.hub.state,
						pendingJoins: toJoin,
					});
					toJoin.forEach((uid) => this.joinSingleUser(uid));
				})
				.fail((error: Error) => {
					this.startInFlight = false;
					sigError('SignalR connection failed:', error);
				});
		} catch (err) {
			this.startInFlight = false;
			sigError('Error starting SignalR connection:', err);
		}
	}

	private joinSingleUser(userId: string): void {
		sigLog('joinSingleUser() ->', { userId });
		this.invoke(Hubs.VibeUpdate.name, Hubs.VibeUpdate.server.JoinUserGroup, userId);
	}

	private rejoinUserGroup(): void {
		// Re-join every currently active user group after a reconnect.
		Array.from(this.userRefCounts.keys()).forEach((uid) => this.joinSingleUser(uid));
	}

	private prewireCatalogHandlers(): void {
		// Walk every (hub, event) declared in the Hubs catalog and wire its
		// dispatcher on the proxy. Safe to call multiple times — wiredHandlers
		// guards against re-binding the same client handler.
		const entries: Array<[string, string]> = [];
		for (const hubDef of Object.values(Hubs) as Array<{
			name: string;
			events: Record<string, string>;
		}>) {
			if (!hubDef?.events) continue;
			for (const eventName of Object.values(hubDef.events)) {
				entries.push([hubDef.name, eventName]);
				const key = subKey(hubDef.name, eventName);
				this.ensureClientHandlerWired(hubDef.name, eventName, key);
			}
		}
		sigLog('prewireCatalogHandlers() entries:', entries);
	}
}

// ---------------------------------------------------------------------------
// SignalRService — per-consumer facade
// ---------------------------------------------------------------------------

export class SignalRService {
	private readonly handles = new Map<string, SubscriptionHandle>();
	private acquired = false;

	constructor(private userId: string) {}

	/** Acquire the shared connection. Idempotent per instance. */
	createConnection(): void {
		if (this.acquired) {
			sigLog('SignalRService.createConnection() already acquired', { userId: this.userId });
			return;
		}
		if (!isSignalRAvailable()) {
			sigError('jQuery and SignalR are required for .NET Framework SignalR');
			return;
		}
		sigLog('SignalRService.createConnection()', { userId: this.userId });
		SignalRConnectionManager.get().acquire(this.userId);
		this.acquired = true;
	}

	/** Subscribe to a server-pushed event on any hub. */
	subscribe(
		hub: string,
		clientMethod: string,
		callback: (data: unknown) => void
	): SubscriptionHandle {
		const id = SignalRConnectionManager.get().subscribe(hub, clientMethod, callback);
		const handle: SubscriptionHandle = { id, hub, method: clientMethod };
		this.handles.set(id, handle);
		return handle;
	}

	/** Unsubscribe a previously returned handle. No-op for stale handles. */
	unsubscribe(handle: SubscriptionHandle): void {
		if (!handle || !this.handles.has(handle.id)) return;
		this.handles.delete(handle.id);
		SignalRConnectionManager.get().unsubscribe(handle.hub, handle.method, handle.id);
	}

	/** Invoke a server method on the named hub. */
	invoke(hub: string, serverMethod: string, ...args: unknown[]): Promise<unknown> | undefined {
		return SignalRConnectionManager.get().invoke(hub, serverMethod, ...args);
	}

	isConnected(): boolean {
		return SignalRConnectionManager.get().isConnected();
	}

	/** Remove all subscriptions made via this instance and release the
	 *  shared connection reference. Safe to call multiple times. */
	dispose(): void {
		sigLog('SignalRService.dispose()', {
			userId: this.userId,
			handles: this.handles.size,
			acquired: this.acquired,
		});
		const mgr = SignalRConnectionManager.get();
		this.handles.forEach((h) => {
			mgr.unsubscribe(h.hub, h.method, h.id);
		});
		this.handles.clear();
		if (this.acquired) {
			this.acquired = false;
			mgr.release(this.userId);
		}
	}
}
