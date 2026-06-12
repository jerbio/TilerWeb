import { beforeEach, describe, expect, it } from 'vitest';
import { renderHook } from '@testing-library/react';
import { act } from 'react';
import useAppStore from '@/global_state';
import { useFlag } from '@/hooks/useFlag';

describe('useFlag', () => {
	beforeEach(() => {
		act(() => {
			useAppStore.setState({ featureFlags: {} });
		});
	});

	it('defaults unknown flags to false', () => {
		const { result } = renderHook(() => useFlag('missing-flag'));

		expect(result.current).toBe(false);
	});

	it('returns the stored value for enabled and disabled flags', () => {
		act(() => {
			useAppStore.getState().setFeatureFlags({
				'chat-suggestions': true,
				'smart-scheduling': false,
			});
		});

		const enabled = renderHook(() => useFlag('chat-suggestions'));
		const disabled = renderHook(() => useFlag('smart-scheduling'));

		expect(enabled.result.current).toBe(true);
		expect(disabled.result.current).toBe(false);
	});

	it('ignores unrelated enabled flags', () => {
		act(() => {
			useAppStore.getState().setFeatureFlags({ 'new-calendar-view': true });
		});

		const { result } = renderHook(() => useFlag('chat-suggestions'));

		expect(result.current).toBe(false);
	});

	it('reacts when feature flags are replaced', () => {
		const { result } = renderHook(() => useFlag('autofill-tile-details'));

		expect(result.current).toBe(false);

		act(() => {
			useAppStore.getState().setFeatureFlags({ 'autofill-tile-details': true });
		});

		expect(result.current).toBe(true);

		act(() => {
			useAppStore.getState().setFeatureFlags({});
		});

		expect(result.current).toBe(false);
	});
});
