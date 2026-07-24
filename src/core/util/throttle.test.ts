import { vi, beforeEach, afterEach } from 'vitest';
import { throttle } from './throttle';

beforeEach(() => {
	vi.useFakeTimers();
});

afterEach(() => {
	vi.useRealTimers();
});

describe('throttle', () => {
	it('fires immediately on the first call', () => {
		const fn = vi.fn();
		const throttled = throttle(fn, 2000);

		throttled();
		expect(fn).toHaveBeenCalledOnce();
	});

	it('suppresses subsequent calls within the wait window', () => {
		const fn = vi.fn();
		const throttled = throttle(fn, 2000);

		throttled();
		vi.advanceTimersByTime(500);
		throttled();
		vi.advanceTimersByTime(500);
		throttled();

		expect(fn).toHaveBeenCalledOnce();
	});

	it('fires again after the wait window has elapsed', () => {
		const fn = vi.fn();
		const throttled = throttle(fn, 2000);

		throttled();
		vi.advanceTimersByTime(2000);
		throttled();

		expect(fn).toHaveBeenCalledTimes(2);
	});

	it('two independent throttled functions have separate timers', () => {
		const fnA = vi.fn();
		const fnB = vi.fn();
		const throttledA = throttle(fnA, 2000);
		const throttledB = throttle(fnB, 2000);

		throttledA();
		vi.advanceTimersByTime(500);
		throttledB();

		expect(fnA).toHaveBeenCalledOnce();
		expect(fnB).toHaveBeenCalledOnce();

		vi.advanceTimersByTime(500);
		throttledA();
		throttledB();

		expect(fnA).toHaveBeenCalledOnce();
		expect(fnB).toHaveBeenCalledOnce();
	});

	it('forwards arguments to the callback', () => {
		const fn = vi.fn();
		const throttled = throttle(fn, 2000);

		throttled('hello', 42);
		expect(fn).toHaveBeenCalledWith('hello', 42);
	});
});
