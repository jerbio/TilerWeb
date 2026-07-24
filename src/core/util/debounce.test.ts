import { vi, beforeEach, afterEach } from 'vitest';
import { debounce } from './debounce';

beforeEach(() => {
	vi.useFakeTimers();
});

afterEach(() => {
	vi.useRealTimers();
});

describe('debounce', () => {
	it('fires the callback after the wait period', () => {
		const fn = vi.fn();
		const debounced = debounce(fn, 300);

		debounced();
		expect(fn).not.toHaveBeenCalled();

		vi.advanceTimersByTime(300);
		expect(fn).toHaveBeenCalledOnce();
	});

	it('only fires once for rapid successive calls (last call wins)', () => {
		const fn = vi.fn();
		const debounced = debounce(fn, 300);

		debounced('a');
		debounced('b');
		debounced('c');

		vi.advanceTimersByTime(300);
		expect(fn).toHaveBeenCalledOnce();
		expect(fn).toHaveBeenCalledWith('c');
	});

	it('resets the timer on each call', () => {
		const fn = vi.fn();
		const debounced = debounce(fn, 300);

		debounced();
		vi.advanceTimersByTime(200);
		debounced();
		vi.advanceTimersByTime(200);

		expect(fn).not.toHaveBeenCalled();

		vi.advanceTimersByTime(100);
		expect(fn).toHaveBeenCalledOnce();
	});

	it('forwards arguments to the callback', () => {
		const fn = vi.fn();
		const debounced = debounce(fn, 100);

		debounced(1, 'hello');
		vi.advanceTimersByTime(100);

		expect(fn).toHaveBeenCalledWith(1, 'hello');
	});

	it('fires again after wait if called again after settling', () => {
		const fn = vi.fn();
		const debounced = debounce(fn, 100);

		debounced();
		vi.advanceTimersByTime(100);
		expect(fn).toHaveBeenCalledOnce();

		debounced();
		vi.advanceTimersByTime(100);
		expect(fn).toHaveBeenCalledTimes(2);
	});
});
