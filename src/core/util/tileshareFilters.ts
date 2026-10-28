import type { ClusterPageParams } from '@/core/common/types/tileshare';

export const deadlineOptions = {
	all: 'Any deadline',
	overdue: 'Overdue',
	today: 'Today',
	next7Days: 'Next 7 days',
	custom: 'Custom range',
	noDeadline: 'No deadline',
} as const;

export type DeadlineOption = keyof typeof deadlineOptions;

function localDate(value: string): Date | null {
	if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
	const date = new Date(`${value}T00:00:00`);
	if (!Number.isFinite(date.getTime())) return null;
	const [year, month, day] = value.split('-').map(Number);
	return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
		? date
		: null;
}

/** Convert local calendar days to UTC bounds; advance calendar days to respect DST. */
export function deadlineParams(
	option: DeadlineOption,
	from: string,
	to: string,
	now = new Date()
): ClusterPageParams | null {
	if (option === 'all') return {};
	if (option === 'overdue') return { deadlineFilter: 'Overdue' };
	if (option === 'noDeadline') return { deadlineFilter: 'NoDeadline' };
	if (option === 'custom') {
		const start = from ? localDate(from) : null;
		const end = to ? localDate(to) : null;
		if ((!from && !to) || (from && !start) || (to && !end) || (start && end && start > end))
			return null;
		end?.setDate(end.getDate() + 1);
		return {
			deadlineFilter: 'Range',
			deadlineFrom: start?.getTime(),
			deadlineBefore: end?.getTime(),
		};
	}
	const start = new Date(now);
	start.setHours(0, 0, 0, 0);
	const end = new Date(start);
	end.setDate(end.getDate() + (option === 'today' ? 1 : 7));
	return {
		deadlineFilter: 'Range',
		deadlineFrom: start.getTime(),
		deadlineBefore: end.getTime(),
	};
}
