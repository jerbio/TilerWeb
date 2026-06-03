import { act, renderHook } from '@testing-library/react';
import usePagination from '../usePagination';

const makeItems = (count: number) => Array.from({ length: count }, (_, i) => i + 1);

describe('usePagination', () => {
	test('returns first page of items', () => {
		const items = makeItems(12);
		const { result } = renderHook(() => usePagination(items, 5, []));

		expect(result.current.page).toBe(1);
		expect(result.current.totalPages).toBe(3);
		expect(result.current.pagedItems).toEqual([1, 2, 3, 4, 5]);
	});

	test('returns correct items for subsequent pages', () => {
		const items = makeItems(12);
		const { result } = renderHook(() => usePagination(items, 5, []));

		act(() => result.current.setPage(2));
		expect(result.current.pagedItems).toEqual([6, 7, 8, 9, 10]);

		act(() => result.current.setPage(3));
		expect(result.current.pagedItems).toEqual([11, 12]);
	});

	test('resets to page 1 when a reset dep changes', () => {
		let dep = 'a';
		const items = makeItems(12);
		const { result, rerender } = renderHook(() => usePagination(items, 5, [dep]));

		act(() => result.current.setPage(3));
		expect(result.current.page).toBe(3);

		dep = 'b';
		rerender();
		expect(result.current.page).toBe(1);
	});

	test('returns totalPages of 0 for empty list', () => {
		const { result } = renderHook(() => usePagination([], 5, []));
		expect(result.current.totalPages).toBe(0);
		expect(result.current.pagedItems).toEqual([]);
	});

	test('respects custom page size', () => {
		const items = makeItems(10);
		const { result } = renderHook(() => usePagination(items, 3, []));

		expect(result.current.totalPages).toBe(4);
		expect(result.current.pagedItems).toEqual([1, 2, 3]);
	});
});
