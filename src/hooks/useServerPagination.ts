import { useEffect, useRef, useState } from 'react';
import type { ItemsPerPage } from '@/core/common/components/Pagination';

export type FetchPage<T> = (params: { page: number; pageSize: ItemsPerPage }) => Promise<T[]>;

/**
 * Server-side pagination. Unlike `usePagination` (which slices an in-memory
 * array), this calls `fetchPage` for the current page whenever `page` or
 * `pageSize` changes.
 *
 * The backend pages by record offset and returns no total count, so there is no
 * `totalPages` — navigation is prev/next driven by `hasNext`.
 *
 * A short page is NOT the end of the list: the server applies Skip/Take before
 * a join that can drop and then de-duplicate rows, so mid-list pages routinely
 * come back with fewer than `pageSize` items. Only an empty page marks the end.
 * Landing on one steps back to the last page that had items and remembers where
 * the list ran out, so the user is never stranded on a blank page.
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

	// First page number known to be empty, once one has been seen. Stops `hasNext`
	// from offering a page we've already found nothing on.
	const emptyPageRef = useRef<number | null>(null);

	useEffect(() => {
		let cancelled = false;

		const load = async () => {
			setLoading(true);
			try {
				const data = await fetchPageRef.current({ page, pageSize });
				if (cancelled) return;

				// Ran off the end: remember it, keep the previous page's items on
				// screen and step back to it rather than showing a blank list.
				if (data.length === 0 && page > 1) {
					emptyPageRef.current = page;
					setHasNext(false);
					setPage(page - 1);
					return;
				}

				setItems(data);
				setHasNext(data.length > 0 && emptyPageRef.current !== page + 1);
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
		// Page boundaries move, so where the list ran out no longer applies.
		emptyPageRef.current = null;
		setPageSizeState(size);
		setPage(1);
	};

	return { items, page, setPage, pageSize, setPageSize, hasNext, loading };
}

export default useServerPagination;
