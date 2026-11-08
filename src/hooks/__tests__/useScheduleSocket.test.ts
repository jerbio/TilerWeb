import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import useAppStore, { type PersonaSession } from '@/global_state';
import { Hubs, SignalRService } from '@/services/SocketService';
import { useScheduleSocket } from '../useScheduleSocket';

vi.mock('@/global_state', async () => {
	const { create } = await import('zustand');
	return {
		default: create(() => ({
			activeSessionType: 'anonymous',
			anonymousPersonaSession: null,
		})),
	};
});

describe('schedule socket subscription', () => {
	const handle = {
		id: 'subscription',
		hub: Hubs.ScheduleChange.name,
		method: Hubs.ScheduleChange.events.RefreshData,
	};
	beforeEach(() => {
		useAppStore.setState({ anonymousPersonaSession: { userId: 'user-1' } as PersonaSession });
		vi.spyOn(SignalRService.prototype, 'createConnection').mockImplementation(() => {});
		vi.spyOn(SignalRService.prototype, 'subscribe').mockReturnValue(handle);
		vi.spyOn(SignalRService.prototype, 'unsubscribe').mockImplementation(() => {});
		vi.spyOn(SignalRService.prototype, 'dispose').mockImplementation(() => {});
	});
	afterEach(() => vi.restoreAllMocks());

	it('reconnects when the active user changes without relying on a parent rerender', () => {
		const { unmount } = renderHook(() => useScheduleSocket(vi.fn()));
		act(() =>
			useAppStore.setState({
				anonymousPersonaSession: { userId: 'user-2' } as PersonaSession,
			})
		);
		expect(SignalRService.prototype.createConnection).toHaveBeenCalledTimes(2);
		expect(SignalRService.prototype.unsubscribe).toHaveBeenCalledWith(handle);
		expect(SignalRService.prototype.dispose).toHaveBeenCalledTimes(1);
		unmount();
		expect(SignalRService.prototype.dispose).toHaveBeenCalledTimes(2);
	});

	it('uses the latest visible-range callback for socket notifications', () => {
		const first = vi.fn();
		const latest = vi.fn();
		const { rerender } = renderHook(({ callback }) => useScheduleSocket(callback), {
			initialProps: { callback: first },
		});
		rerender({ callback: latest });
		const subscriber = vi.mocked(SignalRService.prototype.subscribe).mock.calls[0][2];
		act(() => subscriber({ refreshData: { trigger: true } }));
		expect(first).not.toHaveBeenCalled();
		expect(latest).toHaveBeenCalledOnce();
		expect(SignalRService.prototype.subscribe).toHaveBeenCalledOnce();
	});

	it('waits to connect until an active user exists', () => {
		useAppStore.setState({ anonymousPersonaSession: null });
		renderHook(() => useScheduleSocket(vi.fn()));
		expect(SignalRService.prototype.createConnection).not.toHaveBeenCalled();
		act(() =>
			useAppStore.setState({
				anonymousPersonaSession: { userId: 'user-1' } as PersonaSession,
			})
		);
		expect(SignalRService.prototype.createConnection).toHaveBeenCalledOnce();
	});
});
