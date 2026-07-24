import { act, render, renderHook, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import usePagination from '../usePagination';
import Pagination from '@/core/common/components/Pagination';
import { ThemeProvider } from '@/core/theme/ThemeProvider';

vi.mock('react-i18next', () => ({
	useTranslation: () => ({
		t: (key: string, opts?: { page?: number }) =>
			key === 'common.pagination.page' ? `Page ${opts?.page}` : key,
	}),
}));

const makeItems = (count: number) => Array.from({ length: count }, (_, i) => i + 1);

const renderWithTheme = (ui: React.ReactElement) =>
	render(<ThemeProvider defaultTheme="dark">{ui}</ThemeProvider>);

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

	test('respects the default page size', () => {
		const items = makeItems(25);
		const { result } = renderHook(() => usePagination(items, 10, []));

		expect(result.current.pageSize).toBe(10);
		expect(result.current.totalPages).toBe(3);
		expect(result.current.pagedItems).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
	});

	test('changing page size re-pages and resets to page 1', () => {
		const items = makeItems(20);
		const { result } = renderHook(() => usePagination(items, 5, []));

		act(() => result.current.setPage(3));
		expect(result.current.page).toBe(3);

		act(() => result.current.setPageSize(10));
		expect(result.current.page).toBe(1);
		expect(result.current.pageSize).toBe(10);
		expect(result.current.totalPages).toBe(2);
		expect(result.current.pagedItems).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
	});

	// Shows how the client hook is wired to <Pagination> (numbered mode). The hook
	// supplies `totalPages`, so no `hasNext` is needed; `setPage`/`setPageSize` are
	// passed straight through and the hook re-slices the in-memory list.
	describe('usage with Pagination', () => {
		const Harness = ({ data }: { data: number[] }) => {
			const { page, totalPages, pagedItems, setPage, pageSize, setPageSize } = usePagination(
				data,
				5,
				[]
			);
			return (
				<div>
					<ul>
						{pagedItems.map((n) => (
							<li key={n}>item-{n}</li>
						))}
					</ul>
					<Pagination
						page={page}
						totalPages={totalPages}
						onChange={setPage}
						pageSize={pageSize}
						onPageSizeChange={setPageSize}
					/>
				</div>
			);
		};

		test('renders the current page and navigates with the Next button', () => {
			renderWithTheme(<Harness data={makeItems(12)} />);

			expect(screen.getByText('item-1')).toBeInTheDocument();
			expect(screen.getByText('item-5')).toBeInTheDocument();
			expect(screen.queryByText('item-6')).not.toBeInTheDocument();

			fireEvent.click(screen.getByRole('button', { name: 'Next page' }));

			expect(screen.getByText('item-6')).toBeInTheDocument();
			expect(screen.getByText('item-10')).toBeInTheDocument();
			expect(screen.queryByText('item-1')).not.toBeInTheDocument();
		});

		test('jumps to a numbered page button', () => {
			renderWithTheme(<Harness data={makeItems(12)} />);

			fireEvent.click(screen.getByRole('button', { name: 'Page 3' }));

			expect(screen.getByText('item-11')).toBeInTheDocument();
			expect(screen.getByText('item-12')).toBeInTheDocument();
			expect(screen.queryByText('item-1')).not.toBeInTheDocument();
		});

		test('changing the page size re-pages and resets to page 1', () => {
			renderWithTheme(<Harness data={makeItems(12)} />);

			fireEvent.click(screen.getByRole('button', { name: 'Page 3' }));
			expect(screen.getByText('item-11')).toBeInTheDocument();

			fireEvent.click(screen.getByLabelText('Items per page'));
			fireEvent.mouseDown(screen.getByText('10 / page'));

			expect(screen.getByText('item-1')).toBeInTheDocument();
			expect(screen.getByText('item-10')).toBeInTheDocument();
			expect(screen.queryByText('item-11')).not.toBeInTheDocument();
		});
	});
});
