import dayjs from 'dayjs';
import { formatDetailDate } from './tileshareDate';

describe('formatDetailDate', () => {
	it('formats an epoch as a long ordinal date', () => {
		const epoch = dayjs('2025-07-27').valueOf();
		expect(formatDetailDate(epoch)).toBe('Sun, 27th July, 2025');
	});

	it('applies the correct ordinal suffix', () => {
		expect(formatDetailDate(dayjs('2025-07-01').valueOf())).toContain('1st July');
		expect(formatDetailDate(dayjs('2025-07-02').valueOf())).toContain('2nd July');
		expect(formatDetailDate(dayjs('2025-07-03').valueOf())).toContain('3rd July');
		expect(formatDetailDate(dayjs('2025-07-11').valueOf())).toContain('11th July');
		expect(formatDetailDate(dayjs('2025-07-21').valueOf())).toContain('21st July');
	});

	it('returns an em dash for null/undefined', () => {
		expect(formatDetailDate(null)).toBe('—');
		expect(formatDetailDate(undefined)).toBe('—');
	});
});
