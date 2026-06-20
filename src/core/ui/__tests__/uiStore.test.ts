import { describe, it, expect, beforeEach } from 'vitest';
import { act } from '@testing-library/react';
import useUiStore from '../uiStore';
import { MAX_VISIBLE_NOTIFICATIONS } from '../types';

describe('uiStore', () => {
	beforeEach(() => {
		act(() => {
			useUiStore.getState().notification.clear();
		});
	});

	describe('notification.show', () => {
		it('adds a notification to the store', () => {
			act(() => {
				useUiStore.getState().notification.show('n1', 'Hello', 'info');
			});

			const { items } = useUiStore.getState().notification;
			expect(items).toHaveLength(1);
			expect(items[0].id).toBe('n1');
			expect(items[0].message).toBe('Hello');
			expect(items[0].type).toBe('info');
		});

		it('sets autoDismissMs to null for loading type by default', () => {
			act(() => {
				useUiStore.getState().notification.show('n1', 'Loading...', 'loading');
			});

			expect(useUiStore.getState().notification.items[0].autoDismissMs).toBeNull();
		});

		it('sets autoDismissMs to 3000 for success type by default', () => {
			act(() => {
				useUiStore.getState().notification.show('n1', 'Done!', 'success');
			});

			expect(useUiStore.getState().notification.items[0].autoDismissMs).toBe(3000);
		});

		it('respects explicit autoDismissMs override', () => {
			act(() => {
				useUiStore.getState().notification.show('n1', 'Processing...', 'loading', 5000);
			});

			expect(useUiStore.getState().notification.items[0].autoDismissMs).toBe(5000);
		});

		it('replaces existing notification with same id', () => {
			act(() => {
				useUiStore.getState().notification.show('n1', 'First', 'info');
				useUiStore.getState().notification.show('n1', 'Second', 'success');
			});

			const { items } = useUiStore.getState().notification;
			expect(items).toHaveLength(1);
			expect(items[0].message).toBe('Second');
			expect(items[0].type).toBe('success');
		});

		it('supports multiple notifications with different ids', () => {
			act(() => {
				useUiStore.getState().notification.show('n1', 'First', 'loading');
				useUiStore.getState().notification.show('n2', 'Second', 'info');
				useUiStore.getState().notification.show('n3', 'Third', 'success');
			});

			expect(useUiStore.getState().notification.items).toHaveLength(3);
		});

		it('enforces max visible cap by dropping oldest', () => {
			act(() => {
				for (let i = 0; i < MAX_VISIBLE_NOTIFICATIONS + 2; i++) {
					useUiStore.getState().notification.show(`n${i}`, `Msg ${i}`, 'info');
				}
			});

			const { items } = useUiStore.getState().notification;
			expect(items).toHaveLength(MAX_VISIBLE_NOTIFICATIONS);
			// Oldest should be dropped
			expect(items[0].id).toBe('n2');
		});
	});

	describe('notification.update', () => {
		it('updates an existing notification message and type', () => {
			act(() => {
				useUiStore.getState().notification.show('n1', 'Loading...', 'loading');
				useUiStore.getState().notification.update('n1', 'Done!', 'success');
			});

			const n = useUiStore.getState().notification.items[0];
			expect(n.message).toBe('Done!');
			expect(n.type).toBe('success');
			expect(n.autoDismissMs).toBe(3000);
		});

		it('is a no-op if id does not exist', () => {
			act(() => {
				useUiStore.getState().notification.show('n1', 'Hello', 'info');
				useUiStore.getState().notification.update('nonexistent', 'Nope', 'error');
			});

			const { items } = useUiStore.getState().notification;
			expect(items).toHaveLength(1);
			expect(items[0].message).toBe('Hello');
		});

		it('updates updatedAt timestamp', () => {
			const before = Date.now();
			act(() => {
				useUiStore.getState().notification.show('n1', 'Loading...', 'loading');
			});
			const createdAt = useUiStore.getState().notification.items[0].updatedAt;
			expect(createdAt).toBeGreaterThanOrEqual(before);

			act(() => {
				useUiStore.getState().notification.update('n1', 'Done!', 'success');
			});
			const updatedAt = useUiStore.getState().notification.items[0].updatedAt;
			expect(updatedAt).toBeGreaterThanOrEqual(createdAt);
		});
	});

	describe('notification.dismiss', () => {
		it('removes a notification by id', () => {
			act(() => {
				useUiStore.getState().notification.show('n1', 'Hello', 'info');
				useUiStore.getState().notification.show('n2', 'World', 'success');
				useUiStore.getState().notification.dismiss('n1');
			});

			const { items } = useUiStore.getState().notification;
			expect(items).toHaveLength(1);
			expect(items[0].id).toBe('n2');
		});

		it('is safe to dismiss a nonexistent id', () => {
			act(() => {
				useUiStore.getState().notification.show('n1', 'Hello', 'info');
				useUiStore.getState().notification.dismiss('nonexistent');
			});

			expect(useUiStore.getState().notification.items).toHaveLength(1);
		});
	});

	describe('notification.clear', () => {
		it('removes all notifications', () => {
			act(() => {
				useUiStore.getState().notification.show('n1', 'A', 'info');
				useUiStore.getState().notification.show('n2', 'B', 'loading');
				useUiStore.getState().notification.clear();
			});

			expect(useUiStore.getState().notification.items).toHaveLength(0);
		});
	});
});
