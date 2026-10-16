import { useEffect, useRef, useState } from 'react';
import { TileshareApi } from '@/api/tileshareApi';
import {
	TileShareAssignmentResponse,
	TileShareLockedTimeLineRequest,
} from '@/core/common/types/tilesharePreview';
import { InvitationStatus } from '@/core/common/types/tileshare';
import { useAuth } from '@/core/auth/useAuth';

const api = new TileshareApi();
type Pending = { lockedTimeLineRequest?: TileShareLockedTimeLineRequest };
export function useTilettePreviewResponse(assignmentId: string) {
	const { user } = useAuth();
	const key = `tileshare-preview:${user?.id ?? 'session'}:${assignmentId}`;
	const [pending, setPending] = useState<Pending | null>(() => {
		try {
			const value = JSON.parse(sessionStorage.getItem(key) ?? 'null');
			return value && typeof value === 'object'
				? { lockedTimeLineRequest: value.lockedTimeLineRequest }
				: null;
		} catch {
			return null;
		}
	});
	const [state, setState] = useState<
		'idle' | 'saving' | 'uncertain' | 'accepted' | 'declined' | 'rejected'
	>(pending ? 'uncertain' : 'idle');
	const [calendarId, setCalendarId] = useState<string | null>(null);
	const pendingRef = useRef(pending);
	const active = useRef(true);
	const busy = useRef(false);
	const read = useRef<AbortController | null>(null);
	const save = (value: Pending | null) => {
		pendingRef.current = value;
		setPending(value);
		try {
			if (value) sessionStorage.setItem(key, JSON.stringify(value));
			else sessionStorage.removeItem(key);
		} catch {
			/* Status can still be checked while this view is open. */
		}
	};
	const apply = (result: TileShareAssignmentResponse) => {
		if (result.id !== assignmentId) throw new Error('Assignment mismatch');
		if (result.invitationStatus === InvitationStatus.Accepted) {
			const lock = pendingRef.current?.lockedTimeLineRequest;
			const matches =
				!lock ||
				result.lockedSessions?.some(
					(s) =>
						s.StartTimeUnixMsUtc === lock.StartTimeUnixMsUtc &&
						s.DurationInMs === lock.DurationInMs
				);
			setCalendarId(result.calendarId ?? null);
			save(null);
			setState(matches ? 'accepted' : 'rejected');
		} else if (result.invitationStatus === InvitationStatus.Declined) {
			save(null);
			setState('declined');
		} else setState('uncertain');
	};
	const check = async () => {
		if (busy.current) return;
		read.current?.abort();
		const controller = new AbortController();
		read.current = controller;
		try {
			const result = await api.getAssignmentResponse(assignmentId, controller.signal);
			if (active.current && !controller.signal.aborted) apply(result);
		} catch {
			if (active.current && !controller.signal.aborted) setState('uncertain');
		}
	};
	useEffect(() => {
		active.current = true;
		if (pendingRef.current) void check();
		const recover = () => {
			if (pendingRef.current) void check();
		};
		window.addEventListener('focus', recover);
		return () => {
			active.current = false;
			read.current?.abort();
			window.removeEventListener('focus', recover);
		};
	}, [assignmentId, key]);
	const accept = async (lockedTimeLineRequest?: TileShareLockedTimeLineRequest) => {
		if (busy.current) return;
		busy.current = true;
		read.current?.abort();
		const request = pendingRef.current ?? { lockedTimeLineRequest };
		save(request);
		setState('saving');
		try {
			const result = await api.acceptAssignment(assignmentId, request.lockedTimeLineRequest);
			if (active.current) apply(result);
		} catch (error) {
			if (!active.current) return;
			const failure = error as {
				code?: string;
				status?: number;
				Error?: { Code?: string | number };
			} | null;
			const code = String(failure?.code ?? failure?.status ?? failure?.Error?.Code ?? '');
			if (['400', '403', '404', '409'].includes(code)) {
				save(null);
				setState('rejected');
			} else setState('uncertain');
		} finally {
			busy.current = false;
		}
	};
	const decline = async () => {
		if (busy.current || pendingRef.current) return;
		busy.current = true;
		read.current?.abort();
		setState('saving');
		try {
			await api.respondToInvitation(assignmentId, InvitationStatus.Declined);
			if (active.current) setState('declined');
		} catch {
			if (active.current) setState('uncertain');
		} finally {
			busy.current = false;
		}
	};
	return {
		state,
		calendarId,
		pending,
		accept,
		decline,
		check: () => {
			void check();
		},
		reset: () => {
			if (!pendingRef.current) {
				setState('idle');
				setCalendarId(null);
			}
		},
	};
}
