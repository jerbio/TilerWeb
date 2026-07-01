import { useEffect, useState } from 'react';
import type { ItemsPerPage } from '@/core/common/components/Pagination';

function usePagination<T>(items: T[], defaultPageSize: ItemsPerPage, resetDeps: unknown[]) {
	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState<ItemsPerPage>(defaultPageSize);

	useEffect(() => {
		setPage(1);
	}, resetDeps);

	const changePageSize = (size: ItemsPerPage) => {
		setPageSize(size);
		setPage(1);
	};

	const totalPages = Math.ceil(items.length / pageSize);
	const pagedItems = items.slice((page - 1) * pageSize, page * pageSize);

	return { page, totalPages, pagedItems, setPage, pageSize, setPageSize: changePageSize };
}

export default usePagination;
