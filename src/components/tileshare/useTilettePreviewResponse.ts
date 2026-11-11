import { useEffect, useRef, useState } from 'react';
import { TileshareApi } from '@/api/tileshareApi';
import {
	TileShareAssignmentResponse,
	TileShareLockedTimeLineRequest,
} from '@/core/common/types/tilesharePreview';
import { InvitationStatus } from '@/core/common/types/tileshare';
import { useAuth } from '@/core/auth/useAuth';
import { useInvitationStore, type InvitationState } from './TileShareMutations';

const api = new TileshareApi();
type Pending = { lockedTimeLineRequest?: TileShareLockedTimeLineRequest };
export function useTilettePreviewResponse(assignmentId: string) {
	const { user } = useAuth();
	const mutations = useInvitationStore();
	const sharedOutcome = useRef<InvitationState | undefined>(undefined);
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
			sharedOutcome.current = 'accepted';
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
			sharedOutcome.current = 'declined';
			save(null);
			setState('declined');
		} else {
			sharedOutcome.current = 'uncertain';
			setState('uncertain');
		}
	};
	const publishLate = (result: TileShareAssignmentResponse) => {
		if (result.id !== assignmentId) return;
		if (
			result.invitationStatus === InvitationStatus.Accepted ||
			result.invitationStatus === InvitationStatus.Declined
		) {
			mutations.set(assignmentId, result.invitationStatus);
			window.dispatchEvent(new Event('tileshare-changed'));
		}
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
	const checkRef = useRef(check);
	checkRef.current = check;
	useEffect(() => {
		active.current = true;
		if (pendingRef.current) void checkRef.current();
		const recover = () => {
			if (pendingRef.current) void checkRef.current();
		};
		window.addEventListener('focus', recover);
		return () => {
			active.current = false;
			if (sharedOutcome.current) {
				mutations.set(assignmentId, sharedOutcome.current);
				if (sharedOutcome.current === 'accepted' || sharedOutcome.current === 'declined')
					window.dispatchEvent(new Event('tileshare-changed'));
			}
			read.current?.abort();
			window.removeEventListener('focus', recover);
		};
	}, [assignmentId, key, mutations]);
	const accept = async (lockedTimeLineRequest?: TileShareLockedTimeLineRequest) => {
		if (busy.current || !mutations.acquire(assignmentId)) return;
		busy.current = true;
		sharedOutcome.current = 'uncertain';
		read.current?.abort();
		const request = pendingRef.current ?? { lockedTimeLineRequest };
		save(request);
		setState('saving');
		try {
			const result = await api.acceptAssignment(assignmentId, request.lockedTimeLineRequest);
			if (active.current) apply(result);
			else publishLate(result);
		} catch (error) {
			if (!active.current) return;
			const failure = error as {
				code?: string;
				status?: number;
				Error?: { Code?: string | number };
			} | null;
			const code = String(failure?.code ?? failure?.status ?? failure?.Error?.Code ?? '');
			if (['400', '403', '404', '409'].includes(code)) {
				sharedOutcome.current = undefined;
				save(null);
				setState('rejected');
			} else setState('uncertain');
		} finally {
			mutations.release(assignmentId);
			busy.current = false;
		}
	};
	const decline = async () => {
		if (busy.current || pendingRef.current || !mutations.acquire(assignmentId)) return;
		busy.current = true;
		sharedOutcome.current = 'uncertain';
		read.current?.abort();
		setState('saving');
		try {
			await api.respondToInvitation(assignmentId, InvitationStatus.Declined);
			sharedOutcome.current = 'declined';
			if (active.current) setState('declined');
			else {
				mutations.set(assignmentId, 'declined');
				window.dispatchEvent(new Event('tileshare-changed'));
			}
		} catch {
			if (active.current) setState('uncertain');
		} finally {
			mutations.release(assignmentId);
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
