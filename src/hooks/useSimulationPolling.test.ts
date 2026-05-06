import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { SimulationDto, SimulationState, VibeRequest } from '@/core/common/types/chat';
import { ApiResponse } from '@/core/common/types/api';
import useSimulationPolling from './useSimulationPolling';
import { chatService } from '@/services';

vi.mock('@/services', () => ({
	chatService: {
		getSimulationForRequest: vi.fn(),
	},
}));

const mockedGet = chatService.getSimulationForRequest as unknown as ReturnType<typeof vi.fn>;

function makeRequest(overrides: Partial<VibeRequest> = {}): VibeRequest {
	return {
		id: 'r1',
		creationTimeInMs: 1,
		activeAction: null,
		isClosed: false,
		beforeScheduleId: null,
		afterScheduleId: null,
		actions: [],
		...overrides,
	};
}

function makeSim(state: SimulationState): SimulationDto {
	return {
		id: 'p1',
		vibeRequestId: 'r1',
		tilerUserId: 'u',
		creationTimeInMs: 1,
		state,
		previewActions: [],
	};
}

function envelope(sim: SimulationDto | null): ApiResponse<SimulationDto> {
	return {
		Error: null as unknown as ApiResponse<SimulationDto>['Error'],
		Content: sim as unknown as ApiResponse<SimulationDto>['Content'],
		ServerStatus: null,
	};
}

beforeEach(() => {
	vi.useFakeTimers();
	mockedGet.mockReset();
});
afterEach(() => {
	vi.useRealTimers();
});

describe('useSimulationPolling', () => {
	it('does not poll when request is null', () => {
		renderHook(() => useSimulationPolling(null, null, vi.fn()));
		expect(mockedGet).not.toHaveBeenCalled();
	});

	it('does not poll when the request is terminal (isClosed)', async () => {
		renderHook(() => useSimulationPolling(makeRequest({ isClosed: true }), null, vi.fn()));
		await act(async () => {
			await vi.advanceTimersByTimeAsync(5000);
		});
		expect(mockedGet).not.toHaveBeenCalled();
	});

	it('does not poll when current simulation is terminal (Ready)', async () => {
		renderHook(() => useSimulationPolling(makeRequest(), makeSim('Ready'), vi.fn()));
		await act(async () => {
			await vi.advanceTimersByTimeAsync(5000);
		});
		expect(mockedGet).not.toHaveBeenCalled();
	});

	it('polls immediately on mount and at the initial interval thereafter', async () => {
		mockedGet.mockResolvedValue(envelope(makeSim('Processing')));
		const onSim = vi.fn();
		renderHook(() => useSimulationPolling(makeRequest(), null, onSim));
		await act(async () => {
			await vi.advanceTimersByTimeAsync(0);
		});
		expect(mockedGet).toHaveBeenCalledTimes(1);
		await act(async () => {
			await vi.advanceTimersByTimeAsync(2000);
		});
		expect(mockedGet).toHaveBeenCalledTimes(2);
		expect(onSim).toHaveBeenCalledWith(expect.objectContaining({ state: 'Processing' }));
	});

	it('ramps from initial to capped interval after the ramp window', async () => {
		mockedGet.mockResolvedValue(envelope(makeSim('Processing')));
		renderHook(() =>
			useSimulationPolling(makeRequest(), null, vi.fn(), {
				initialIntervalMs: 1000,
				cappedIntervalMs: 5000,
				rampWindowMs: 3000,
			})
		);
		// initial fetch
		await act(async () => {
			await vi.advanceTimersByTimeAsync(0);
		});
		expect(mockedGet).toHaveBeenCalledTimes(1);
		// 3 polls during the ramp window @ 1s each
		for (let i = 0; i < 3; i++) {
			await act(async () => {
				await vi.advanceTimersByTimeAsync(1000);
			});
		}
		expect(mockedGet).toHaveBeenCalledTimes(4);
		// After ramp window — interval should be capped at 5s.
		await act(async () => {
			await vi.advanceTimersByTimeAsync(1000);
		});
		expect(mockedGet).toHaveBeenCalledTimes(4);
		await act(async () => {
			await vi.advanceTimersByTimeAsync(4000);
		});
		expect(mockedGet).toHaveBeenCalledTimes(5);
	});

	it('stops polling once the simulation transitions to Ready', async () => {
		mockedGet.mockResolvedValueOnce(envelope(makeSim('Processing')));
		mockedGet.mockResolvedValueOnce(envelope(makeSim('Ready')));
		const onSim = vi.fn();
		const { rerender } = renderHook(
			(props: { sim: SimulationDto | null }) =>
				useSimulationPolling(makeRequest(), props.sim, onSim, {
					initialIntervalMs: 1000,
					cappedIntervalMs: 1000,
					rampWindowMs: 30000,
				}),
			{ initialProps: { sim: null as SimulationDto | null } }
		);
		await act(async () => {
			await vi.advanceTimersByTimeAsync(0);
		});
		await act(async () => {
			await vi.advanceTimersByTimeAsync(1000);
		});
		expect(mockedGet).toHaveBeenCalledTimes(2);
		// Caller now passes the Ready sim back in.
		rerender({ sim: makeSim('Ready') });
		await act(async () => {
			await vi.advanceTimersByTimeAsync(5000);
		});
		expect(mockedGet).toHaveBeenCalledTimes(2);
	});

	it('in-flight guard prevents overlapping requests', async () => {
		let resolve!: (v: ApiResponse<SimulationDto>) => void;
		mockedGet.mockImplementation(
			() => new Promise<ApiResponse<SimulationDto>>((r) => (resolve = r))
		);
		renderHook(() =>
			useSimulationPolling(makeRequest(), null, vi.fn(), {
				initialIntervalMs: 100,
				cappedIntervalMs: 100,
				rampWindowMs: 30000,
			})
		);
		// Fire initial poll, then advance several intervals while it's still
		// in flight — only one outbound request should exist.
		await act(async () => {
			await vi.advanceTimersByTimeAsync(500);
		});
		expect(mockedGet).toHaveBeenCalledTimes(1);
		await act(async () => {
			resolve(envelope(makeSim('Processing')));
		});
	});

	it('stops polling on unmount', async () => {
		mockedGet.mockResolvedValue(envelope(makeSim('Processing')));
		const { unmount } = renderHook(() =>
			useSimulationPolling(makeRequest(), null, vi.fn(), {
				initialIntervalMs: 100,
				cappedIntervalMs: 100,
				rampWindowMs: 30000,
			})
		);
		await act(async () => {
			await vi.advanceTimersByTimeAsync(0);
		});
		expect(mockedGet).toHaveBeenCalledTimes(1);
		unmount();
		await act(async () => {
			await vi.advanceTimersByTimeAsync(1000);
		});
		expect(mockedGet).toHaveBeenCalledTimes(1);
	});

	// Plan §6.6.5 — anonymous user threading. Without it, the polling
	// fetcher would call the backend without an `AnonymousUserId` query
	// parameter, and the backend's anonymous-user authorization filter
	// would reject (NotFound / 401) the read on a refresh-rehydrated
	// anonymous session.
	it('threads `anonymousUserId` through to the default fetcher', async () => {
		mockedGet.mockResolvedValue(envelope(makeSim('Processing')));
		renderHook(() =>
			useSimulationPolling(makeRequest(), null, vi.fn(), {
				anonymousUserId: 'anon-user-42',
			})
		);
		await act(async () => {
			await vi.advanceTimersByTimeAsync(0);
		});
		expect(mockedGet).toHaveBeenCalledWith('r1', 'anon-user-42');
	});
});
