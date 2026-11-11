import { tileshareService } from '@/services';
import type { TileShareCluster } from '@/core/common/types/tileshare';
import { useShareResource, type ShareResource } from './useShareResource';

export type UseClusterHeaderResult = ShareResource<TileShareCluster>;
const fetchHeader = (id: string) => tileshareService.getClusterHeader(id);
export function useClusterHeader(
	id: string | null,
	viewerId?: string | null
): UseClusterHeaderResult {
	return useShareResource(id, fetchHeader, viewerId ?? '');
}
export default useClusterHeader;
