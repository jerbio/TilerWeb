import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSidePanelStack } from '../useSidePanelStack';
import { SidePanelEntry } from '../side_panel_types';
import React from 'react';

const makeEntry = (label: string): SidePanelEntry => ({
	content: React.createElement('div', null, label),
});

describe('useSidePanelStack', () => {
	it('initialises with the given entries', () => {
		const initial = [makeEntry('Chat')];
		const { result } = renderHook(() => useSidePanelStack(initial));
		expect(result.current.stack).toHaveLength(1);
	});

	it('push adds an entry to the top of the stack', () => {
		const { result } = renderHook(() => useSidePanelStack([makeEntry('Chat')]));

		act(() => {
			result.current.push(makeEntry('Edit'));
		});

		expect(result.current.stack).toHaveLength(2);
	});

	it('pop removes the top entry', () => {
		const { result } = renderHook(() => useSidePanelStack([makeEntry('Chat')]));

		act(() => {
			result.current.push(makeEntry('Edit'));
		});
		expect(result.current.stack).toHaveLength(2);

		act(() => {
			result.current.pop();
		});
		expect(result.current.stack).toHaveLength(1);
	});

	it('pop does not remove the last entry', () => {
		const { result } = renderHook(() => useSidePanelStack([makeEntry('Chat')]));

		act(() => {
			result.current.pop();
		});

		expect(result.current.stack).toHaveLength(1);
	});

	it('push then pop returns to the original stack', () => {
		const chat = makeEntry('Chat');
		const { result } = renderHook(() => useSidePanelStack([chat]));

		act(() => {
			result.current.push(makeEntry('Edit'));
		});
		act(() => {
			result.current.pop();
		});

		expect(result.current.stack).toHaveLength(1);
		expect(result.current.stack[0]).toBe(chat);
	});

	it('supports multiple pushes and pops in order', () => {
		const { result } = renderHook(() => useSidePanelStack([makeEntry('A')]));

		act(() => {
			result.current.push(makeEntry('B'));
		});
		act(() => {
			result.current.push(makeEntry('C'));
		});
		expect(result.current.stack).toHaveLength(3);

		act(() => {
			result.current.pop();
		});
		expect(result.current.stack).toHaveLength(2);

		act(() => {
			result.current.pop();
		});
		expect(result.current.stack).toHaveLength(1);
	});
});
