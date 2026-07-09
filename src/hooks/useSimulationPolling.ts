import { useEffect, useRef } from 'react';
import { chatService } from '@/services';
import { SimulationDto, VibeRequest } from '@/core/common/types/chat';
import { isRequestTerminal, isSimulationTerminal } from '@/core/util/simulationSelectors';

export interface SimulationPollingOptions {
	initialIntervalMs?: number;
	cappedIntervalMs?: number;
	/** After this many ms since the first poll, switch to the capped interval. */
	rampWindowMs?: number;
	/** Optional override for getting the simulation. Mostly for tests. */
	fetchFn?: (vibeRequestId: string) => Promise<{ Content?: SimulationDto | null } | null>;
	/**
	 * Plan §6.6.5 — anonymous user identifier threaded through to
	 * `getSimulationForRequest` so the backend's anonymous-user query
	 * (`AnonymousUserId` parameter) accepts the request when no auth
	 * cookie is present. Required for refresh-rehydration of anonymous
	 * sessions.
	 */
	anonymousUserId?: string;
}

const DEFAULTS = {
	initialIntervalMs: 2000,
	cappedIntervalMs: 10000,
	rampWindowMs: 30000,
};

/**
 * Polls the backend for the active simulation associated with a request,
 * ramping the interval from `initialIntervalMs` up to `cappedIntervalMs`
 * once the ramp window has elapsed. Calls `onSimulation` whenever a fresh
 * simulation row is received.
 *
 * Stop conditions: no request, request terminal, current simulation
 * terminal (Ready / Failed / Invalidated), or component unmount. Includes
 * an in-flight guard to prevent overlapping fetches.
 */
export default function useSimulationPolling(
	request: VibeRequest | null,
	currentSimulation: SimulationDto | null,
	onSimulation: (sim: SimulationDto) => void,
	options?: SimulationPollingOptions
): void {
	const initialIntervalMs = options?.initialIntervalMs ?? DEFAULTS.initialIntervalMs;
	const cappedIntervalMs = options?.cappedIntervalMs ?? DEFAULTS.cappedIntervalMs;
	const rampWindowMs = options?.rampWindowMs ?? DEFAULTS.rampWindowMs;
	const fetchFn = options?.fetchFn;
	const anonymousUserId = options?.anonymousUserId;
	const onSimRef = useRef(onSimulation);
	onSimRef.current = onSimulation;

	const inFlightRef = useRef(false);
	const requestId = request?.id ?? null;
	const requestTerminal = isRequestTerminal(request);
	const simTerminal = isSimulationTerminal(currentSimulation);

	useEffect(() => {
		if (!requestId) return;
		if (requestTerminal) return;
		if (simTerminal) return;

		let cancelled = false;
		let timer: ReturnType<typeof setTimeout> | null = null;
		const startedAt = Date.now();

		const tick = async () => {
			if (cancelled) return;
			if (inFlightRef.current) {
				schedule();
				return;
			}
			inFlightRef.current = true;
			try {
				const fetcher =
					fetchFn ??
					((id: string) => chatService.getSimulationForRequest(id, anonymousUserId));
				const resp = await fetcher(requestId);
				const sim = resp?.Content ?? null;
				if (!cancelled && sim) {
					onSimRef.current(sim);
					if (isSimulationTerminal(sim)) {
						return;
					}
				}
			} catch (err) {
				console.error('useSimulationPolling fetch failed:', err);
			} finally {
				inFlightRef.current = false;
			}
			if (!cancelled) schedule();
		};

		const schedule = () => {
			const elapsed = Date.now() - startedAt;
			const interval = elapsed >= rampWindowMs ? cappedIntervalMs : initialIntervalMs;
			timer = setTimeout(tick, interval);
		};

		// Kick off immediately.
		tick();

		return () => {
			cancelled = true;
			if (timer) clearTimeout(timer);
		};
	}, [
		requestId,
		requestTerminal,
		simTerminal,
		initialIntervalMs,
		cappedIntervalMs,
		rampWindowMs,
		fetchFn,
		anonymousUserId,
	]);
}
