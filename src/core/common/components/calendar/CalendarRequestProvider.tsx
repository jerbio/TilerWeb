import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import {
	CalendarRequest,
	CalendarRequestEnvelope,
	CalendarRequestHandler,
	CalendarRequestResult,
	CalendarRequestStatus,
	CalendarRequestType,
} from './calendarRequestContext';
import CalendarNavigationFeedback, { CalendarNavigationState } from './CalendarNavigationFeedback';

// ── Context (internal) ─────────────────────────────────────────

type CalendarRequestBus = {
	dispatch: (request: CalendarRequest, onResult?: (r: CalendarRequestResult) => void) => void;
	subscribe: (handler: CalendarRequestHandler) => () => void;
};

const CalendarRequestCtx = createContext<CalendarRequestBus | null>(null);

// ── Provider ───────────────────────────────────────────────────

export const CalendarRequestProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	// Keep calendar subscriptions stable while navigation feedback changes.
	const listenersRef = useRef<Set<CalendarRequestHandler>>(new Set());
	const [navigation, setNavigation] = useState<CalendarNavigationState | null>(null);
	const navigationVersion = useRef(0);
	const navigationTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
	const retryRef = useRef<(() => void) | undefined>(undefined);
	const cancelRef = useRef<(() => void) | null>(null);
	const clearNavigationTimer = useCallback(() => {
		if (navigationTimer.current) clearTimeout(navigationTimer.current);
		navigationTimer.current = null;
	}, []);
	useEffect(
		() => () => {
			navigationVersion.current++;
			clearNavigationTimer();
		},
		[clearNavigationTimer]
	);

	const subscribe = useCallback((handler: CalendarRequestHandler) => {
		listenersRef.current.add(handler);
		return () => {
			listenersRef.current.delete(handler);
		};
	}, []);

	const dispatch: CalendarRequestBus['dispatch'] = useCallback(
		(request: CalendarRequest, onResult?: (r: CalendarRequestResult) => void) => {
			const version = ++navigationVersion.current;
			cancelRef.current?.();
			cancelRef.current = null;
			clearNavigationTimer();
			retryRef.current = undefined;
			setNavigation(null);
			let settled = false;
			const report = (result: CalendarRequestResult) => {
				if (version !== navigationVersion.current || settled) return;
				if (result.status === CalendarRequestStatus.Navigating) {
					setNavigation({ phase: result.phase ?? 'locating', date: result.date });
				} else {
					settled = true;
					cancelRef.current = null;
					clearNavigationTimer();
					if (result.status === CalendarRequestStatus.Found) {
						setNavigation({ phase: 'opening' });
						// Keep acknowledgement visible while the details popup animates in.
						navigationTimer.current = setTimeout(() => setNavigation(null), 300);
					} else {
						setNavigation({ phase: 'locating', outcome: result.status });
						if (
							result.status === CalendarRequestStatus.Error ||
							result.status === CalendarRequestStatus.NotFound
						) {
							retryRef.current = () => dispatch(request, onResult);
						}
					}
				}
				onResult?.(result);
			};
			const isFocus = request.type === CalendarRequestType.FocusEvent;
			if (isFocus) {
				cancelRef.current = () =>
					onResult?.({
						status: CalendarRequestStatus.Cancelled,
						entityId: request.entityId,
					});
				setNavigation({ phase: 'locating' });
				navigationTimer.current = setTimeout(() => {
					// Cancel pending work too, so a late response cannot open a popup.
					listenersRef.current.forEach((handler) =>
						handler({ request: { type: CalendarRequestType.ClearSelection } })
					);
					report({
						status: CalendarRequestStatus.Error,
						code: 'timeout',
					});
				}, 30000);
			}
			const envelope: CalendarRequestEnvelope = {
				request,
				onResult: isFocus ? report : onResult,
			};
			listenersRef.current.forEach((handler) => {
				try {
					handler(envelope);
				} catch (err) {
					console.error('[CalendarRequestProvider] handler error:', err);
					if (isFocus)
						report({
							status: CalendarRequestStatus.Error,
							code: 'open_failed',
						});
				}
			});
			if (isFocus && listenersRef.current.size === 0) {
				report({ status: CalendarRequestStatus.Error, code: 'calendar_unavailable' });
			}
		},
		[clearNavigationTimer]
	);

	const bus = useRef<CalendarRequestBus>({ dispatch, subscribe });

	return (
		<CalendarRequestCtx.Provider value={bus.current}>
			{children}
			{navigation && (
				<CalendarNavigationFeedback
					state={navigation}
					onRetry={retryRef.current}
					onDismiss={() => setNavigation(null)}
				/>
			)}
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

/**
 * Like {@link useCalendarDispatch} but returns `null` instead of throwing when
 * rendered outside a `CalendarRequestProvider`. Use this from components that
 * may be mounted in isolation (e.g. the edit panel's sub-events section) where
 * calendar navigation is a best-effort enhancement rather than a hard require.
 */
export function useOptionalCalendarDispatch() {
	const ctx = useContext(CalendarRequestCtx);
	return ctx?.dispatch ?? null;
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
