import { useCallback, useEffect, useRef, useState } from 'react';
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
 *
 * `loading` and `error` only describe the initial fetch. `refresh()` re-fetches
 * in the background instead: it keeps the page's content mounted (no skeleton,
 * no remount of the body or of open modals) and a failed background refresh
 * keeps the existing data rather than wiping the page.
 */
export function useClusterDetail(clusterId: string | null): UseClusterDetailResult {
	const [data, setData] = useState<ClusterDetail | null>(null);
	const [loading, setLoading] = useState<boolean>(clusterId !== null);
	const [error, setError] = useState<Error | null>(null);
	// Whether a load has already succeeded, so a background refresh doesn't
	// flip `loading` and unmount the page's content while it re-fetches.
	const hasLoaded = useRef(false);

	const load = useCallback(async () => {
		if (!clusterId) {
			hasLoaded.current = false;
			setData(null);
			setLoading(false);
			setError(null);
			return;
		}
		const initial = !hasLoaded.current;
		if (initial) {
			setLoading(true);
			setError(null);
		}
		try {
			const next = await tileshareService.getClusterDetail(clusterId);
			hasLoaded.current = true;
			setData(next);
		} catch (err) {
			// Only an initial failure surfaces the error state (which also
			// clears the content); a failed background refresh keeps the page
			// as-is so in-progress UI is not torn down.
			if (initial) {
				setError(err instanceof Error ? err : new Error(String(err)));
				setData(null);
			} else {
				console.error('Error refreshing tileshare cluster', err);
			}
		} finally {
			if (initial) setLoading(false);
		}
	}, [clusterId]);

	useEffect(() => {
		// A new cluster is a fresh initial load even if the previous one succeeded.
		hasLoaded.current = false;
		void load();
	}, [load]);

	return { data, loading, error, refresh: load };
}

export default useClusterDetail;
