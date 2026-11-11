import { tileshareService } from '@/services';
import type { TileShareTemplate } from '@/core/common/types/tileshare';
import { useShareResource, type ShareResource } from './useShareResource';

export type UseTiletteDetailResult = ShareResource<TileShareTemplate>;
const fetchDetail = (id: string) => tileshareService.getTileletteDetail(id);
export function useTiletteDetail(
	id: string | null,
	viewerId?: string | null
): UseTiletteDetailResult {
	return useShareResource(id, fetchDetail, viewerId ?? '');
}
export default useTiletteDetail;
