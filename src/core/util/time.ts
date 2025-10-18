import dayjs from 'dayjs';

type TimeUnit = 'w' | 'd' | 'h' | 'm';
const _quantities: Record<TimeUnit, number> = {
	w: 7 * 24 * 60 * 60 * 1000,
	d: 24 * 60 * 60 * 1000,
	h: 60 * 60 * 1000,
	m: 60 * 1000,
} as const;

class TimeUtil {
	static rangeDuration(start: dayjs.Dayjs, end: dayjs.Dayjs): string {
		const quantitiesInMins = Object.entries(_quantities).map(
			([unit, quantity]) => [unit, quantity / (60 * 1000)] as [TimeUnit, number]
		);

		const totalSeconds = end.diff(start, 'second');
		let totalMinutes = Math.ceil(totalSeconds / 60);

		const parts = quantitiesInMins
			.map(([unit, divisor]) => {
				const value = Math.floor(totalMinutes / divisor);
				if (value > 0) {
					totalMinutes -= value * divisor;
					return `${value}${unit}`;
				}
				return '';
			})
			.filter(Boolean);

		return parts.join(' ') || '0m';
	}

	static inMilliseconds(value: number, unit: TimeUnit): number {
		if (!(unit in _quantities)) {
			throw new Error(`Invalid time unit: ${unit}`);
		}
		return value * _quantities[unit];
	}

	static now(): number {
		return Date.now();
	}

	static nowDayjs(): dayjs.Dayjs {
		return dayjs();
	}

	static nowISO(): string {
		return new Date(TimeUtil.now()).toISOString();
	}

	static currentYear(): number {
		return new Date(TimeUtil.now()).getFullYear();
	}
}

export default TimeUtil;
