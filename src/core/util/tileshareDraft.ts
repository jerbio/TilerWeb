import dayjs from 'dayjs';
import { TiletteDraft } from '@/core/common/types/tileshare';
import { emptyTileshareLocation } from './tileshareMode';

export const defaultShareDeadline = (now = new Date()): string =>
	dayjs(now).add(7, 'day').format('YYYY-MM-DD');
export const defaultTiletteDeadline = (shareDeadline?: string, now = new Date()): string =>
	shareDeadline || dayjs(now).add(1, 'day').format('YYYY-MM-DD');

export function newTiletteDraft(): TiletteDraft {
	return {
		id: crypto.randomUUID(),
		name: '',
		durationMinutes: '60',
		deadline: '',
		note: '',
		recipients: [],
		location: emptyTileshareLocation(),
		moveShareDeadline: false,
	};
}
