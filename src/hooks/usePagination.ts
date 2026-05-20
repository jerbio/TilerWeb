import { useEffect, useState } from 'react';

function usePagination<T>(items: T[], pageSize: number, resetDeps: unknown[]) {
	const [page, setPage] = useState(1);

	useEffect(() => {
		setPage(1);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, resetDeps);

	const totalPages = Math.ceil(items.length / pageSize);
	const pagedItems = items.slice((page - 1) * pageSize, page * pageSize);

	return { page, totalPages, pagedItems, setPage };
}

export default usePagination;
