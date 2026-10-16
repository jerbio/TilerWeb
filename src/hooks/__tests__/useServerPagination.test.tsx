import { vi } from 'vitest';
import { render, renderHook, act, waitFor, screen, fireEvent } from '@testing-library/react';
import useServerPagination from '../useServerPagination';
import Pagination from '@/core/common/components/Pagination';
import { ThemeProvider } from '@/core/theme/ThemeProvider';

vi.mock('react-i18next', () => ({
	useTranslation: () => ({
		t: (key: string, opts?: { page?: number }) =>
			key === 'common.pagination.page' ? `Page ${opts?.page}` : key,
	}),
}));

const makePage = (size: number) => Array.from({ length: size }, (_, i) => i + 1);

const renderWithTheme = (ui: React.ReactElement) =>
	render(<ThemeProvider defaultTheme="dark">{ui}</ThemeProvider>);

describe('useServerPagination', () => {
	it('fetches the first page on mount with the default page size', async () => {
		const fetchPage = vi.fn().mockResolvedValue(makePage(10));
		const { result } = renderHook(() => useServerPagination(fetchPage, 10));

		await waitFor(() => expect(result.current.loading).toBe(false));

		expect(fetchPage).toHaveBeenCalledWith({ page: 1, pageSize: 10 });
		expect(result.current.items).toEqual(makePage(10));
	});

	it('reports hasNext true when a full page is returned', async () => {
		const fetchPage = vi.fn().mockResolvedValue(makePage(10));
		const { result } = renderHook(() => useServerPagination(fetchPage, 10));

		await waitFor(() => expect(result.current.hasNext).toBe(true));
	});

	// The server de-duplicates after Skip/Take, so mid-list pages come back short.
	it('reports hasNext true when a short page is returned', async () => {
		const fetchPage = vi.fn().mockResolvedValue(makePage(4));
		const { result } = renderHook(() => useServerPagination(fetchPage, 10));

		await waitFor(() => expect(result.current.loading).toBe(false));
		expect(result.current.hasNext).toBe(true);
	});

	it('reports hasNext false when the first page is empty', async () => {
		const fetchPage = vi.fn().mockResolvedValue([]);
		const { result } = renderHook(() => useServerPagination(fetchPage, 10));

		await waitFor(() => expect(result.current.loading).toBe(false));
		expect(result.current.items).toEqual([]);
		expect(result.current.hasNext).toBe(false);
	});

	it('steps back and keeps the last non-empty page when a later page is empty', async () => {
		const fetchPage = vi.fn(({ page }: { page: number }) =>
			Promise.resolve(page === 1 ? makePage(4) : [])
		);
		const { result } = renderHook(() => useServerPagination(fetchPage, 10));

		await waitFor(() => expect(result.current.loading).toBe(false));
		act(() => result.current.setPage(2));

		await waitFor(() => expect(result.current.page).toBe(1));
		expect(result.current.items).toEqual(makePage(4));
		// Page 2 is known empty, so Next is not offered again.
		expect(result.current.hasNext).toBe(false);
	});

	it('refetches when the page changes', async () => {
		const fetchPage = vi.fn().mockResolvedValue(makePage(10));
		const { result } = renderHook(() => useServerPagination(fetchPage, 10));

		await waitFor(() => expect(result.current.loading).toBe(false));
		act(() => result.current.setPage(2));

		await waitFor(() => expect(fetchPage).toHaveBeenLastCalledWith({ page: 2, pageSize: 10 }));
	});

	it('resets to page 1 and refetches when the page size changes', async () => {
		const fetchPage = vi.fn().mockResolvedValue(makePage(5));
		const { result } = renderHook(() => useServerPagination(fetchPage, 10));

		await waitFor(() => expect(result.current.loading).toBe(false));
		act(() => result.current.setPage(3));
		await waitFor(() => expect(result.current.page).toBe(3));

		act(() => result.current.setPageSize(5));

		await waitFor(() => expect(result.current.page).toBe(1));
		expect(result.current.pageSize).toBe(5);
		await waitFor(() => expect(fetchPage).toHaveBeenLastCalledWith({ page: 1, pageSize: 5 }));
	});

	it('clears items and hasNext on fetch error', async () => {
		const fetchPage = vi.fn().mockRejectedValue(new Error('boom'));
		const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
		const { result } = renderHook(() => useServerPagination(fetchPage, 10));

		await waitFor(() => expect(result.current.loading).toBe(false));
		expect(result.current.items).toEqual([]);
		expect(result.current.hasNext).toBe(false);
		errorSpy.mockRestore();
	});

	// Shows how the server hook is wired to <Pagination> (simple mode). There is no
	// total count, so the hook's `hasNext` drives the Next button and `items` is the
	// current page straight from the fetcher. Clicking Next/changing size refetches.
	describe('usage with Pagination', () => {
		type FetchArgs = { page: number; pageSize: number };

		const Harness = ({ fetchPage }: { fetchPage: (p: FetchArgs) => Promise<number[]> }) => {
			const { items, page, setPage, pageSize, setPageSize, hasNext, loading } =
				useServerPagination(fetchPage, 10);
			return (
				<div>
					<ul>
						{items.map((n) => (
							<li key={n}>item-{n}</li>
						))}
					</ul>
					<Pagination
						mode="simple"
						page={page}
						onChange={setPage}
						hasNext={hasNext}
						pageSize={pageSize}
						onPageSizeChange={setPageSize}
						disabled={loading}
					/>
				</div>
			);
		};

		test('loads the first page and navigates to the next via Pagination', async () => {
			const fetchPage = vi.fn(({ page, pageSize }: FetchArgs) => {
				if (page === 1) return Promise.resolve(makePage(pageSize));
				return Promise.resolve(page === 2 ? [101, 102] : []);
			});

			renderWithTheme(<Harness fetchPage={fetchPage} />);

			await waitFor(() => expect(screen.getByText('item-1')).toBeInTheDocument());
			expect(screen.getByText('item-10')).toBeInTheDocument();
			expect(screen.getByText('Page 1')).toBeInTheDocument();

			const next = screen.getByRole('button', { name: 'Next page' });
			expect(next).toBeEnabled();
			fireEvent.click(next);

			await waitFor(() => expect(screen.getByText('item-101')).toBeInTheDocument());
			expect(screen.getByText('item-102')).toBeInTheDocument();
			expect(screen.getByText('Page 2')).toBeInTheDocument();
			// A short page is not the end of the list, so Next stays available.
			const nextOnPage2 = screen.getByRole('button', { name: 'Next page' });
			expect(nextOnPage2).toBeEnabled();

			// Page 3 is empty: fall back to page 2 and stop offering Next.
			fireEvent.click(nextOnPage2);

			await waitFor(() => expect(screen.getByText('Page 2')).toBeInTheDocument());
			expect(screen.getByText('item-101')).toBeInTheDocument();
			await waitFor(() =>
				expect(screen.getByRole('button', { name: 'Next page' })).toBeDisabled()
			);
		});

		test('changing the page size refetches page 1', async () => {
			const fetchPage = vi.fn(({ pageSize }: FetchArgs) =>
				Promise.resolve(makePage(pageSize))
			);

			renderWithTheme(<Harness fetchPage={fetchPage} />);
			await waitFor(() => expect(screen.getByText('item-10')).toBeInTheDocument());

			fireEvent.click(screen.getByLabelText('Items per page'));
			fireEvent.mouseDown(screen.getByText('5 / page'));

			await waitFor(() =>
				expect(fetchPage).toHaveBeenLastCalledWith({ page: 1, pageSize: 5 })
			);
			await waitFor(() => expect(screen.queryByText('item-6')).not.toBeInTheDocument());
			expect(screen.getByText('item-5')).toBeInTheDocument();
		});
	});
});
