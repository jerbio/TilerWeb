import { describe, it, expect, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { useTiletteDetail } from '../useTiletteDetail';
import type { TileShareTemplate } from '@/core/common/types/tileshare';

const mocks = vi.hoisted(() => ({ getTileletteDetail: vi.fn() }));
vi.mock('@/services', () => ({
	tileshareService: { getTileletteDetail: mocks.getTileletteDetail },
}));

function deferred<T>() {
	let resolve!: (value: T) => void;
	const promise = new Promise<T>((res) => {
		resolve = res;
	});
	return { promise, resolve };
}

const tilette = (name: string): TileShareTemplate =>
	({ id: 't1', name }) as unknown as TileShareTemplate;

describe('useTiletteDetail', () => {
	it('shows loading during the initial fetch and clears it on success', async () => {
		const pending = deferred<TileShareTemplate>();
		mocks.getTileletteDetail.mockReturnValue(pending.promise);
		const { result } = renderHook(() => useTiletteDetail('t1'));
		expect(result.current.loading).toBe(true);
		expect(result.current.data).toBeNull();
		await act(async () => {
			pending.resolve(tilette('one'));
		});
		expect(result.current.loading).toBe(false);
		expect(result.current.data).toEqual(tilette('one'));
		expect(result.current.error).toBeNull();
	});

	it('re-fetches in the background without flipping loading, so the page keeps its content', async () => {
		mocks.getTileletteDetail.mockResolvedValueOnce(tilette('one'));
		const { result } = renderHook(() => useTiletteDetail('t1'));
		await waitFor(() => expect(result.current.loading).toBe(false));
		expect(result.current.data).toEqual(tilette('one'));

		const pending = deferred<TileShareTemplate>();
		mocks.getTileletteDetail.mockReturnValueOnce(pending.promise);
		await act(async () => {
			void result.current.refresh();
		});
		// While the refresh is in flight the hook must still report the loaded
		// content: the page swaps in a skeleton and remounts the whole body
		// (including open modals) whenever `loading` goes true.
		expect(result.current.loading).toBe(false);
		expect(result.current.data).toEqual(tilette('one'));
		await act(async () => {
			pending.resolve(tilette('two'));
		});
		expect(result.current.data).toEqual(tilette('two'));
	});

	it('keeps the current data and no error when a background refresh fails', async () => {
		mocks.getTileletteDetail
			.mockResolvedValueOnce(tilette('one'))
			.mockRejectedValueOnce(new Error('network'));
		const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
		const { result } = renderHook(() => useTiletteDetail('t1'));
		await waitFor(() => expect(result.current.loading).toBe(false));
		await act(async () => {
			await result.current.refresh();
		});
		expect(result.current.data).toEqual(tilette('one'));
		expect(result.current.error).toBeNull();
		expect(result.current.loading).toBe(false);
		errorSpy.mockRestore();
	});

	it('surfaces an error and no data when the initial fetch fails', async () => {
		mocks.getTileletteDetail.mockRejectedValue(new Error('boom'));
		const { result } = renderHook(() => useTiletteDetail('t1'));
		await waitFor(() => expect(result.current.error).toBeInstanceOf(Error));
		expect(result.current.data).toBeNull();
		expect(result.current.loading).toBe(false);
	});
});
