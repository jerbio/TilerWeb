import { useCallback, useEffect, useRef, useState } from 'react';

export interface ShareResource<T> {
	data: T | null;
	loading: boolean;
	error: Error | null;
	refreshing: boolean;
	refreshError: Error | null;
	refresh: () => Promise<void>;
}
type RequestScope = {
	id: string;
	key: string;
	active: boolean;
	loaded: boolean;
	queued: boolean;
	running: Promise<void> | null;
};

/** Serialize refreshes, retain drafts during updates, and discard obsolete route results. */
export function useShareResource<T>(
	id: string | null,
	fetcher: (id: string) => Promise<T>,
	identity = ''
): ShareResource<T> {
	const key = JSON.stringify([identity, id]);
	const [state, setState] = useState({
		key,
		data: null as T | null,
		loading: id !== null,
		error: null as Error | null,
		refreshing: false,
		refreshError: null as Error | null,
	});
	const scopeRef = useRef<RequestScope | null>(null);
	const refresh = useCallback((): Promise<void> => {
		const scope = scopeRef.current;
		if (!id || !scope?.active || scope.key !== key) return Promise.resolve();
		if (scope.running) {
			scope.queued = true;
			return scope.running;
		}
		const run = async () => {
			let failure: Error | null = null;
			do {
				scope.queued = false;
				if (!scope.active) return;
				setState((previous) => ({
					...previous,
					loading: !scope.loaded,
					refreshing: scope.loaded,
				}));
				try {
					const data = await fetcher(id);
					if (!scope.active) return;
					scope.loaded = true;
					failure = null;
					setState({
						key,
						data,
						loading: false,
						error: null,
						refreshing: false,
						refreshError: null,
					});
				} catch (cause) {
					if (!scope.active) return;
					failure = cause instanceof Error ? cause : new Error(String(cause));
					setState((previous) => ({
						...previous,
						loading: false,
						refreshing: false,
						error: scope.loaded ? null : failure,
						refreshError: scope.loaded ? failure : null,
					}));
				}
			} while (scope.queued && scope.active);
			if (failure) throw failure;
		};
		scope.running = run().finally(() => {
			scope.running = null;
		});
		return scope.running;
	}, [id, key, fetcher]);
	useEffect(() => {
		const scope: RequestScope | null = id
			? { id, key, active: true, loaded: false, queued: false, running: null }
			: null;
		scopeRef.current = scope;
		setState({
			key,
			data: null,
			loading: id !== null,
			error: null,
			refreshing: false,
			refreshError: null,
		});
		const automaticRefresh = () => {
			void refresh().catch(() => undefined);
		};
		const foreground = () => {
			if (document.visibilityState === 'visible') automaticRefresh();
		};
		automaticRefresh();
		window.addEventListener('tileshare-changed', automaticRefresh);
		document.addEventListener('visibilitychange', foreground);
		return () => {
			if (scope) scope.active = false;
			window.removeEventListener('tileshare-changed', automaticRefresh);
			document.removeEventListener('visibilitychange', foreground);
		};
	}, [id, key, refresh]);
	return {
		...(state.key === key
			? state
			: {
					data: null,
					loading: id !== null,
					error: null,
					refreshing: false,
					refreshError: null,
				}),
		refresh,
	};
}
