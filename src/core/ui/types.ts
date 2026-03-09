export type NotificationType = 'loading' | 'success' | 'error' | 'info';

export interface AppNotification {
	/** Unique identifier — allows targeted updates (e.g. from WebSocket) */
	id: string;
	/** Display message */
	message: string;
	/** Notification type determines icon and styling */
	type: NotificationType;
	/** Auto-dismiss duration in ms. Null means it persists until explicitly dismissed. */
	autoDismissMs: number | null;
	/** Timestamp when the notification was created or last updated */
	updatedAt: number;
}

/** Maximum number of concurrent notifications displayed */
export const MAX_VISIBLE_NOTIFICATIONS = 4;

/** Default auto-dismiss duration for non-loading notifications */
export const DEFAULT_AUTO_DISMISS_MS = 3000;

/** Actions that can produce a notification */
export enum NotificationAction {
	SetAsNow = 'set-now',
	Complete = 'complete',
	Delete = 'delete',
	Shuffle = 'shuffle',
	Revise = 'revise',
	ProcrastinateAll = 'procrastinate-all',
}

/** Build a deterministic notification ID from an action and entity ID */
export const notificationId = (action: NotificationAction, entityId: string): string =>
	`${action}-${entityId}`;
