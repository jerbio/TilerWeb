import dayjs from 'dayjs';

const formatter = {
	timeDuration: (start: dayjs.Dayjs, end: dayjs.Dayjs): string => {
		const quantities = [
			['d', 24 * 60], // minutes in a day
			['h', 60], // minutes in an hour
			['m', 1], // minute
		] as const;

    // Approximate to the nearest second
    let totalSeconds = end.diff(start, 'second');
    let totalMinutes = Math.ceil(totalSeconds / 60);

    const parts = quantities.map(([unit, divisor]) => {
      const value = Math.floor(totalMinutes / divisor);
      if (value > 0) {
        totalMinutes -= value * divisor;
        return `${value} ${unit}`;
      }
      return '';
    }).filter(Boolean);

		return parts.join(' ') || '0m';
	},
};

export default formatter;