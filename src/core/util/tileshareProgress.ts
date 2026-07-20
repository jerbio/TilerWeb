import { TileletteStatus, TileShareTemplate } from '@/core/common/types/tileshare';

/**
 * Derive a tilette's completion status.
 *
 * The backend has no per-tilette completion field yet, so this is a stub that
 * always reports {@link TileletteStatus.InProgress}. When the wire field lands,
 * this is the only place that changes — call sites and the progress rollup stay
 * as they are.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function deriveTileletteStatus(tilette: TileShareTemplate): TileletteStatus {
	return TileletteStatus.InProgress;
}

/**
 * Cluster progress as a whole percentage (0–100), rolled up from the collective
 * tilette statuses. Returns 0 for an empty (or null) list.
 *
 * `resolveStatus` defaults to {@link deriveTileletteStatus}; it's injectable so
 * the rollup math can be exercised independently of the current stub.
 */
export function computeClusterProgress(
	tilettes: TileShareTemplate[] | null,
	resolveStatus: (tilette: TileShareTemplate) => TileletteStatus = deriveTileletteStatus
): number {
	if (!tilettes || tilettes.length === 0) return 0;

	const completed = tilettes.filter(
		(tilette) => resolveStatus(tilette) === TileletteStatus.Completed
	).length;

	return Math.round((completed / tilettes.length) * 100);
}
