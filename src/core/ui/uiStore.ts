import { create } from 'zustand';
import {
	AppNotification,
	NotificationType,
	NotificationOptions,
	MAX_VISIBLE_NOTIFICATIONS,
	DEFAULT_AUTO_DISMISS_MS,
} from './types';

interface NotificationSlice {
	/** Current list of visible notifications */
	items: AppNotification[];
	/**
	 * Show a new notification or replace an existing one with the same id.
	 * Loading notifications persist until explicitly updated or dismissed.
	 * Other types auto-dismiss after `autoDismissMs` (default 3 s).
	 */
	show: (
		id: string,
		message: string,
		type: NotificationType,
		autoDismissMs?: number | null,
		options?: NotificationOptions
	) => void;
	/**
	 * Update an existing notification (e.g. transition loading → success).
	 * If the id does not exist this is a no-op.
	 */
	update: (
		id: string,
		message: string,
		type: NotificationType,
		autoDismissMs?: number | null,
		options?: NotificationOptions
	) => void;
	/** Dismiss (remove) a notification by id. */
	dismiss: (id: string) => void;
	/** Remove all notifications. */
	clear: () => void;
}

export interface UiState {
	notification: NotificationSlice;
}

const resolveAutoDismiss = (type: NotificationType, explicit?: number | null): number | null => {
	if (explicit !== undefined) return explicit;
	return type === 'loading' ? null : DEFAULT_AUTO_DISMISS_MS;
};

const useUiStore = create<UiState>((set) => ({
	notification: {
		items: [],

		show: (id, message, type, autoDismissMs?, options?) => {
			set((state) => {
				const current = state.notification.items;
				const existing = current.findIndex((n) => n.id === id);
				const notification: AppNotification = {
					id,
					message,
					type,
					autoDismissMs:
						options?.dismissible === false
							? null
							: resolveAutoDismiss(type, autoDismissMs),
					dismissible: options?.dismissible ?? true,
					action: options?.action,
					updatedAt: Date.now(),
				};

				let next: AppNotification[];
				if (existing >= 0) {
					next = [...current];
					next[existing] = notification;
				} else {
					next = [...current, notification];
				}

				while (next.length > MAX_VISIBLE_NOTIFICATIONS) {
					const removable = next.findIndex((item) => item.dismissible !== false);
					if (removable < 0) break;
					next.splice(removable, 1);
				}

				return { notification: { ...state.notification, items: next } };
			});
		},

		update: (id, message, type, autoDismissMs?, options?) => {
			set((state) => {
				const current = state.notification.items;
				const idx = current.findIndex((n) => n.id === id);
				if (idx === -1) return state;

				const next = [...current];
				next[idx] = {
					...next[idx],
					message,
					type,
					autoDismissMs:
						(options?.dismissible ?? next[idx].dismissible) === false
							? null
							: resolveAutoDismiss(type, autoDismissMs),
					dismissible: options?.dismissible ?? next[idx].dismissible ?? true,
					action: options ? options.action : next[idx].action,
					updatedAt: Date.now(),
				};
				return { notification: { ...state.notification, items: next } };
			});
		},

		dismiss: (id) => {
			set((state) => ({
				notification: {
					...state.notification,
					items: state.notification.items.filter((n) => n.id !== id),
				},
			}));
		},

		clear: () => {
			set((state) => ({
				notification: { ...state.notification, items: [] },
			}));
		},
	},
}));

export default useUiStore;
