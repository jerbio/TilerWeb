import { useCallback, useEffect, useRef, useState } from 'react';
import { tileshareService } from '@/services';
import type { TileShareCluster } from '@/core/common/types/tileshare';

export interface UseClusterHeaderResult {
	data: TileShareCluster | null;
	loading: boolean;
	error: Error | null;
	/** Force a re-fetch of the cluster header. */
	refresh: () => Promise<void>;
}

/**
 * Loads only a cluster's header (name, dates, flags) — e.g. to resolve a
 * tilette's parent cluster for the breadcrumb. Inert while `clusterId` is null.
 */
export function useClusterHeader(clusterId: string | null): UseClusterHeaderResult {
	const [data, setData] = useState<TileShareCluster | null>(null);
	const [loading, setLoading] = useState<boolean>(clusterId !== null);
	const [error, setError] = useState<Error | null>(null);
	const hasLoaded = useRef(false);

	const load = useCallback(async () => {
		if (!clusterId) {
			hasLoaded.current = false;
			setData(null);
			setLoading(false);
			return;
		}
		const initial = !hasLoaded.current;
		if (initial) {
			setLoading(true);
			setError(null);
		}
		try {
			const next = await tileshareService.getClusterHeader(clusterId);
			setData(next);
			hasLoaded.current = true;
		} catch (err) {
			if (initial) {
				setError(err instanceof Error ? err : new Error(String(err)));
				setData(null);
			} else console.error('Error refreshing cluster header', err);
		} finally {
			if (initial) setLoading(false);
		}
	}, [clusterId]);

	useEffect(() => {
		hasLoaded.current = false;
		void load();
	}, [load]);

	return { data, loading, error, refresh: load };
}

export default useClusterHeader;
