import { useCallback, useEffect, useState } from 'react';
import { tileshareService } from '@/services';
import type { ClusterDetail } from '@/core/common/types/tileshare';

export interface UseClusterDetailResult {
	data: ClusterDetail | null;
	loading: boolean;
	error: Error | null;
	/** Force a re-fetch of the cluster detail. */
	refresh: () => Promise<void>;
}

/**
 * Loads a tileshare cluster's detail (header + tilette list) for the detail page.
 * Inert while `clusterId` is null.
 */
export function useClusterDetail(clusterId: string | null): UseClusterDetailResult {
	const [data, setData] = useState<ClusterDetail | null>(null);
	const [loading, setLoading] = useState<boolean>(clusterId !== null);
	const [error, setError] = useState<Error | null>(null);

	const load = useCallback(async () => {
		if (!clusterId) {
			setData(null);
			setLoading(false);
			return;
		}
		setLoading(true);
		setError(null);
		try {
			const next = await tileshareService.getClusterDetail(clusterId);
			setData(next);
		} catch (err) {
			setError(err instanceof Error ? err : new Error(String(err)));
			setData(null);
		} finally {
			setLoading(false);
		}
	}, [clusterId]);

	useEffect(() => {
		void load();
	}, [load]);

	return { data, loading, error, refresh: load };
}

export default useClusterDetail;
