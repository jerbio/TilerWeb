import { useCallback, useEffect, useState } from 'react';
import { tileshareService } from '@/services';
import type { TileShareTemplate } from '@/core/common/types/tileshare';

export interface UseTiletteDetailResult {
	data: TileShareTemplate | null;
	loading: boolean;
	error: Error | null;
	/** Force a re-fetch of the tilette detail. */
	refresh: () => Promise<void>;
}

/**
 * Loads a single tilette's (single tileshare) detail. Inert while `tiletteId`
 * is null.
 */
export function useTiletteDetail(tiletteId: string | null): UseTiletteDetailResult {
	const [data, setData] = useState<TileShareTemplate | null>(null);
	const [loading, setLoading] = useState<boolean>(tiletteId !== null);
	const [error, setError] = useState<Error | null>(null);

	const load = useCallback(async () => {
		if (!tiletteId) {
			setData(null);
			setLoading(false);
			return;
		}
		setLoading(true);
		setError(null);
		try {
			const next = await tileshareService.getTileletteDetail(tiletteId);
			setData(next);
		} catch (err) {
			setError(err instanceof Error ? err : new Error(String(err)));
			setData(null);
		} finally {
			setLoading(false);
		}
	}, [tiletteId]);

	useEffect(() => {
		void load();
	}, [load]);

	return { data, loading, error, refresh: load };
}

export default useTiletteDetail;
