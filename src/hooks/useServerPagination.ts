import { useEffect, useRef, useState } from 'react';
import type { ItemsPerPage } from '@/core/common/components/Pagination';

export type FetchPage<T> = (params: { page: number; pageSize: ItemsPerPage }) => Promise<T[]>;

/**
 * Server-side pagination. Unlike `usePagination` (which slices an in-memory
 * array), this calls `fetchPage` for the current page whenever `page` or
 * `pageSize` changes.
 *
 * The backend pages by record offset and returns no total count, so there is no
 * `totalPages` — navigation is prev/next driven by `hasNext`, which is inferred
 * from whether the page came back full (`items.length === pageSize`).
 */
function useServerPagination<T>(fetchPage: FetchPage<T>, defaultPageSize: ItemsPerPage) {
	const [page, setPage] = useState(1);
	const [pageSize, setPageSizeState] = useState<ItemsPerPage>(defaultPageSize);
	const [items, setItems] = useState<T[]>([]);
	const [loading, setLoading] = useState(false);
	const [hasNext, setHasNext] = useState(false);

	// Keep the latest fetcher without making it an effect dependency, so passing
	// an inline arrow (or an unbound method) doesn't retrigger the fetch.
	const fetchPageRef = useRef(fetchPage);
	fetchPageRef.current = fetchPage;

	useEffect(() => {
		let cancelled = false;

		const load = async () => {
			setLoading(true);
			try {
				const data = await fetchPageRef.current({ page, pageSize });
				if (cancelled) return;
				setItems(data);
				setHasNext(data.length === pageSize);
			} catch (error) {
				if (cancelled) return;
				console.error('Error fetching paginated data', error);
				setItems([]);
				setHasNext(false);
			} finally {
				if (!cancelled) setLoading(false);
			}
		};

		load();
		return () => {
			cancelled = true;
		};
	}, [page, pageSize]);

	const setPageSize = (size: ItemsPerPage) => {
		setPageSizeState(size);
		setPage(1);
	};

	return { items, page, setPage, pageSize, setPageSize, hasNext, loading };
}

export default useServerPagination;
