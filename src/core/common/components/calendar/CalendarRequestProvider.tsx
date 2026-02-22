import React, { createContext, useCallback, useContext, useEffect, useRef } from 'react';
import {
	CalendarRequest,
	CalendarRequestEnvelope,
	CalendarRequestHandler,
	CalendarRequestResult,
} from './calendarRequestContext';

// ── Context (internal) ─────────────────────────────────────────

type CalendarRequestBus = {
	dispatch: (request: CalendarRequest, onResult?: (r: CalendarRequestResult) => void) => void;
	subscribe: (handler: CalendarRequestHandler) => () => void;
};

const CalendarRequestCtx = createContext<CalendarRequestBus | null>(null);

// ── Provider ───────────────────────────────────────────────────

export const CalendarRequestProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	// Ref-based subscriber set — dispatching never causes re-renders.
	const listenersRef = useRef<Set<CalendarRequestHandler>>(new Set());

	const subscribe = useCallback((handler: CalendarRequestHandler) => {
		listenersRef.current.add(handler);
		return () => {
			listenersRef.current.delete(handler);
		};
	}, []);

	const dispatch = useCallback(
		(request: CalendarRequest, onResult?: (r: CalendarRequestResult) => void) => {
			const envelope: CalendarRequestEnvelope = { request, onResult };
			listenersRef.current.forEach((handler) => {
				try {
					handler(envelope);
				} catch (err) {
					console.error('[CalendarRequestProvider] handler error:', err);
				}
			});
		},
		[]
	);

	const bus = useRef<CalendarRequestBus>({ dispatch, subscribe });

	return (
		<CalendarRequestCtx.Provider value={bus.current}>
			{children}
		</CalendarRequestCtx.Provider>
	);
};

// ── Hook: dispatchers (Chat, etc.) ─────────────────────────────

/**
 * Returns a stable `dispatch` function to send requests to the calendar.
 *
 * ```ts
 * const dispatch = useCalendarDispatch();
 * dispatch({ type: 'focus_event', entityId, entityType, actionType });
 * ```
 */
export function useCalendarDispatch() {
	const ctx = useContext(CalendarRequestCtx);
	if (!ctx) {
		throw new Error('useCalendarDispatch must be used within CalendarRequestProvider');
	}
	return ctx.dispatch;
}

// ── Hook: listeners (Calendar internals) ───────────────────────

/**
 * Subscribes a handler that is called whenever a `CalendarRequest` is dispatched.
 * Auto-unsubscribes on unmount. The handler identity is tracked by ref so it
 * can safely be an inline closure without causing re-subscriptions.
 *
 * ```ts
 * useCalendarRequestListener((envelope) => {
 *   if (envelope.request.type === 'focus_event') { ... }
 * });
 * ```
 */
export function useCalendarRequestListener(handler: CalendarRequestHandler) {
	const ctx = useContext(CalendarRequestCtx);
	if (!ctx) {
		throw new Error('useCalendarRequestListener must be used within CalendarRequestProvider');
	}

	// Keep a stable ref so the subscribe/unsubscribe pair doesn't churn.
	const handlerRef = useRef(handler);
	handlerRef.current = handler;

	useEffect(() => {
		const wrappedHandler: CalendarRequestHandler = (envelope) => {
			handlerRef.current(envelope);
		};
		return ctx.subscribe(wrappedHandler);
	}, [ctx]);
}
