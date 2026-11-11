import { describe, it, expect, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { useClusterDetail } from '../useClusterDetail';
import type { ClusterDetail } from '@/core/common/types/tileshare';

const mocks = vi.hoisted(() => ({ getClusterDetail: vi.fn() }));
vi.mock('@/services', () => ({
	tileshareService: { getClusterDetail: mocks.getClusterDetail },
}));

function deferred<T>() {
	let resolve!: (value: T) => void;
	let reject!: (error: unknown) => void;
	const promise = new Promise<T>((res, rej) => {
		resolve = res;
		reject = rej;
	});
	return { promise, resolve, reject };
}

const detail = (name: string): ClusterDetail =>
	({ cluster: { id: 'c1', name }, tilettes: [] }) as unknown as ClusterDetail;

describe('useClusterDetail', () => {
	it('shows loading during the initial fetch and clears it on success', async () => {
		const pending = deferred<ClusterDetail>();
		mocks.getClusterDetail.mockReturnValue(pending.promise);
		const { result } = renderHook(() => useClusterDetail('c1'));
		expect(result.current.loading).toBe(true);
		expect(result.current.data).toBeNull();
		await act(async () => {
			pending.resolve(detail('one'));
		});
		expect(result.current.loading).toBe(false);
		expect(result.current.data).toEqual(detail('one'));
		expect(result.current.error).toBeNull();
	});

	it('re-fetches in the background without flipping loading, so the page keeps its content', async () => {
		mocks.getClusterDetail.mockResolvedValueOnce(detail('one'));
		const { result } = renderHook(() => useClusterDetail('c1'));
		await waitFor(() => expect(result.current.loading).toBe(false));
		expect(result.current.data).toEqual(detail('one'));

		const pending = deferred<ClusterDetail>();
		mocks.getClusterDetail.mockReturnValueOnce(pending.promise);
		await act(async () => {
			void result.current.refresh();
		});
		// While the refresh is in flight the hook must still report the loaded
		// content: the page swaps in a skeleton and remounts the whole body
		// (including open modals) whenever `loading` goes true.
		expect(result.current.loading).toBe(false);
		expect(result.current.data).toEqual(detail('one'));
		await act(async () => {
			pending.resolve(detail('two'));
		});
		expect(result.current.data).toEqual(detail('two'));
	});

	it('keeps the current data and no error when a background refresh fails', async () => {
		mocks.getClusterDetail
			.mockResolvedValueOnce(detail('one'))
			.mockRejectedValueOnce(new Error('network'));
		const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
		const { result } = renderHook(() => useClusterDetail('c1'));
		await waitFor(() => expect(result.current.loading).toBe(false));
		await act(async () => {
			await expect(result.current.refresh()).rejects.toThrow('network');
		});
		expect(result.current.data).toEqual(detail('one'));
		expect(result.current.error).toBeNull();
		expect(result.current.loading).toBe(false);
		expect(result.current.refreshError?.message).toBe('network');
		errorSpy.mockRestore();
	});
	it('queues one trailing refresh for changes arriving during a request', async () => {
		const pending = deferred<ClusterDetail>();
		mocks.getClusterDetail
			.mockReset()
			.mockReturnValueOnce(pending.promise)
			.mockResolvedValueOnce(detail('fresh'));
		const { result } = renderHook(() => useClusterDetail('c1'));
		act(() => {
			window.dispatchEvent(new Event('tileshare-changed'));
			window.dispatchEvent(new Event('tileshare-changed'));
		});
		await act(async () => {
			pending.resolve(detail('old'));
		});
		await waitFor(() => expect(result.current.data?.cluster.name).toBe('fresh'));
		expect(mocks.getClusterDetail).toHaveBeenCalledTimes(2);
	});
	it('ignores a previous share’s late response', async () => {
		const pending = deferred<ClusterDetail>();
		mocks.getClusterDetail
			.mockReset()
			.mockReturnValueOnce(pending.promise)
			.mockResolvedValueOnce(detail('new share'));
		const { result, rerender } = renderHook(({ id }) => useClusterDetail(id), {
			initialProps: { id: 'old' },
		});
		rerender({ id: 'new' });
		await waitFor(() => expect(result.current.data?.cluster.name).toBe('new share'));
		await act(async () => {
			pending.resolve(detail('old share'));
		});
		expect(result.current.data?.cluster.name).toBe('new share');
	});
	it('refreshes when returning to the document without replacing its content', async () => {
		mocks.getClusterDetail
			.mockReset()
			.mockResolvedValueOnce(detail('old'))
			.mockResolvedValueOnce(detail('updated'));
		const { result } = renderHook(() => useClusterDetail('c1'));
		await waitFor(() => expect(result.current.data?.cluster.name).toBe('old'));
		Object.defineProperty(document, 'visibilityState', {
			value: 'visible',
			configurable: true,
		});
		act(() => document.dispatchEvent(new Event('visibilitychange')));
		await waitFor(() => expect(result.current.data?.cluster.name).toBe('updated'));
	});
	it('does not apply an old user’s result to the same share', async () => {
		const pending = deferred<ClusterDetail>();
		mocks.getClusterDetail
			.mockReset()
			.mockReturnValueOnce(pending.promise)
			.mockResolvedValueOnce(detail('current user'));
		const { result, rerender } = renderHook(({ viewer }) => useClusterDetail('c1', viewer), {
			initialProps: { viewer: 'old' },
		});
		rerender({ viewer: 'new' });
		await waitFor(() => expect(result.current.data?.cluster.name).toBe('current user'));
		await act(async () => {
			pending.resolve(detail('old user'));
		});
		expect(result.current.data?.cluster.name).toBe('current user');
	});

	it('surfaces an error and no data when the initial fetch fails', async () => {
		mocks.getClusterDetail.mockRejectedValue(new Error('boom'));
		const { result } = renderHook(() => useClusterDetail('c1'));
		await waitFor(() => expect(result.current.error).toBeInstanceOf(Error));
		expect(result.current.data).toBeNull();
		expect(result.current.loading).toBe(false);
	});

	it('treats a new cluster id as a fresh initial load', async () => {
		const pending = deferred<ClusterDetail>();
		mocks.getClusterDetail
			.mockResolvedValueOnce(detail('one'))
			.mockReturnValueOnce(pending.promise);
		const { result, rerender } = renderHook(({ id }) => useClusterDetail(id), {
			initialProps: { id: 'c1' },
		});
		await waitFor(() => expect(result.current.loading).toBe(false));
		rerender({ id: 'c2' });
		expect(result.current.loading).toBe(true);
		await act(async () => {
			pending.resolve(detail('two'));
		});
		expect(result.current.loading).toBe(false);
		expect(result.current.data).toEqual(detail('two'));
	});
});
