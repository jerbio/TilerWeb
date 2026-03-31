import { renderHook, act } from '@testing-library/react';
import dayjs from 'dayjs';
import useFormHandler from '../useFormHandler';

describe('useFormHandler', () => {
	it('preserves dayjs instances so .startOf() is callable', () => {
		const initial = {
			start: dayjs('2026-03-29'),
			name: 'test',
		};

		const { result } = renderHook(() => useFormHandler(initial));

		// formData.start must still be a dayjs object
		expect(dayjs.isDayjs(result.current.formData.start)).toBe(true);
		expect(typeof result.current.formData.start.startOf).toBe('function');

		// Calling startOf should not throw
		expect(() => result.current.formData.start.startOf('day')).not.toThrow();
	});

	it('preserves dayjs instances after resetForm()', () => {
		const initial = {
			start: dayjs('2026-03-29'),
			name: 'test',
		};

		const { result } = renderHook(() => useFormHandler(initial));

		// Modify the name field
		act(() => {
			result.current.handleFormInputChange('name', { mode: 'static' })('changed');
		});

		// Reset
		act(() => {
			result.current.resetForm();
		});

		expect(dayjs.isDayjs(result.current.formData.start)).toBe(true);
		expect(typeof result.current.formData.start.startOf).toBe('function');
	});

	it('preserves class instances with methods', () => {
		class Color {
			constructor(public r: number, public g: number, public b: number) {}
			toHex() {
				return `#${this.r.toString(16)}${this.g.toString(16)}${this.b.toString(16)}`;
			}
		}

		const initial = {
			color: new Color(255, 0, 0),
			label: 'red',
		};

		const { result } = renderHook(() => useFormHandler(initial));

		expect(result.current.formData.color).toBeInstanceOf(Color);
		expect(typeof result.current.formData.color.toHex).toBe('function');
	});
});
