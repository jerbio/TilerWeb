import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { act } from 'react';
import useAppStore from '@/global_state';
import { useFlag } from '@/hooks/useFlag';

beforeEach(() => {
	act(() => {
		useAppStore.setState({ featureFlags: {} });
	});
});

describe('useFlag', () => {
	describe('when flag is not in store', () => {
		it('returns false by default', () => {
			const { result } = renderHook(() => useFlag('some-unknown-flag'));
			expect(result.current).toBe(false);
		});
	});

	describe('when flag is in store', () => {
		it('returns true when flag is enabled', () => {
			act(() => {
				useAppStore.setState({ featureFlags: { 'chat-suggestions': true } });
			});

			const { result } = renderHook(() => useFlag('chat-suggestions'));
			expect(result.current).toBe(true);
		});

		it('returns false when flag is explicitly disabled', () => {
			act(() => {
				useAppStore.setState({ featureFlags: { 'chat-suggestions': false } });
			});

			const { result } = renderHook(() => useFlag('chat-suggestions'));
			expect(result.current).toBe(false);
		});

		it('returns false for an unrelated flag when others are set', () => {
			act(() => {
				useAppStore.setState({ featureFlags: { 'new-calendar-view': true } });
			});

			const { result } = renderHook(() => useFlag('chat-suggestions'));
			expect(result.current).toBe(false);
		});
	});

	describe('reactivity', () => {
		it('updates when the flag value changes in the store', () => {
			const { result } = renderHook(() => useFlag('smart-scheduling'));
			expect(result.current).toBe(false);

			act(() => {
				useAppStore.setState({ featureFlags: { 'smart-scheduling': true } });
			});

			expect(result.current).toBe(true);
		});

		it('updates when flags are cleared', () => {
			act(() => {
				useAppStore.setState({ featureFlags: { 'smart-scheduling': true } });
			});

			const { result } = renderHook(() => useFlag('smart-scheduling'));
			expect(result.current).toBe(true);

			act(() => {
				useAppStore.setState({ featureFlags: {} });
			});

			expect(result.current).toBe(false);
		});
	});
});
