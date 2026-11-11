import dayjs from 'dayjs';

/** Keep date order, names, and clock conventions in the user's locale. */
export function formatDetailDate(
	epoch: number | null | undefined,
	locale = dayjs.locale()
): string {
	if (epoch == null || !Number.isFinite(epoch) || !dayjs(epoch).isValid()) return '—';
	return new Intl.DateTimeFormat(locale, {
		weekday: 'short',
		day: 'numeric',
		month: 'long',
		year: 'numeric',
	}).format(epoch);
}
export function formatDetailTime(
	epoch: number | null | undefined,
	locale = dayjs.locale()
): string {
	if (epoch == null || !Number.isFinite(epoch) || !dayjs(epoch).isValid()) return '—';
	return new Intl.DateTimeFormat(locale, { timeStyle: 'short' }).format(epoch);
}

export function formatMinutes(milliseconds: number, locale?: string): string {
	return new Intl.NumberFormat(locale, {
		style: 'unit',
		unit: 'minute',
		unitDisplay: 'long',
		maximumFractionDigits: 1,
	}).format(milliseconds / 60000);
}

/** A date-only deadline has no timezone; never shift it to the preceding day. */
export function formatDeadlineDate(value: string, locale = dayjs.locale()): string {
	if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return '—';
	const date = new Date(`${value}T12:00:00Z`);
	if (!Number.isFinite(date.valueOf()) || date.toISOString().slice(0, 10) !== value) return '—';
	return new Intl.DateTimeFormat(locale, { dateStyle: 'long', timeZone: 'UTC' }).format(date);
}

export function formatDuration(milliseconds: number, locale?: string): string {
	return milliseconds % 3600000 === 0
		? new Intl.NumberFormat(locale, {
				style: 'unit',
				unit: 'hour',
				unitDisplay: 'long',
			}).format(milliseconds / 3600000)
		: formatMinutes(milliseconds, locale);
}
