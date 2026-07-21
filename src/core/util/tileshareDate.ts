import dayjs from 'dayjs';

/** English ordinal suffix for a day-of-month (1 -> "1st", 22 -> "22nd"). */
function ordinal(day: number): string {
	const suffixes = ['th', 'st', 'nd', 'rd'];
	const mod100 = day % 100;
	return `${day}${suffixes[(mod100 - 20) % 10] ?? suffixes[mod100] ?? suffixes[0]}`;
}

/**
 * Long, ordinal date for tileshare detail headers, e.g. "Mon, 27th July, 2025".
 *
 * Built manually rather than via dayjs' `Do` token so it doesn't depend on the
 * `advancedFormat` plugin being registered globally.
 */
export function formatDetailDate(epoch: number | null | undefined): string {
	if (epoch == null) return '—';
	const d = dayjs(epoch);
	if (!d.isValid()) return '—';
	return d.format('ddd, [__DAY__] MMMM, YYYY').replace('__DAY__', ordinal(d.date()));
}
