import { describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { useClusterHeader } from '../useClusterHeader';
const api = vi.hoisted(() => ({ getClusterHeader: vi.fn() }));
vi.mock('@/services', () => ({ tileshareService: api }));
describe('parent header refresh during owner edits', () => {
	it('retains the loaded owner and deadline if the background refresh fails', async () => {
		const share = { id: 'share', name: 'Launch', creator: { id: 'owner' }, end: 1234 };
		api.getClusterHeader
			.mockResolvedValueOnce(share)
			.mockRejectedValueOnce(new Error('offline'));
		const errorLog = vi.spyOn(console, 'error').mockImplementation(() => {});
		const { result } = renderHook(() => useClusterHeader('share'));
		await waitFor(() => expect(result.current.loading).toBe(false));
		await act(() => result.current.refresh());
		expect(result.current.data).toEqual(share);
		expect(result.current.error).toBeNull();
		expect(result.current.loading).toBe(false);
		errorLog.mockRestore();
	});
});
