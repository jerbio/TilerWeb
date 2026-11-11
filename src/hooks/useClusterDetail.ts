import { tileshareService } from '@/services';
import type { ClusterDetail } from '@/core/common/types/tileshare';
import { useShareResource, type ShareResource } from './useShareResource';

export type UseClusterDetailResult = ShareResource<ClusterDetail>;
const fetchDetail = (id: string) => tileshareService.getClusterDetail(id);
export function useClusterDetail(
	id: string | null,
	viewerId?: string | null
): UseClusterDetailResult {
	return useShareResource(id, fetchDetail, viewerId ?? '');
}
export default useClusterDetail;
