/**
 * Anonymous visitor and session identity.
 *
 * Deliberately distinct from `chat_session_id` and `tiler-persona-users`: those are
 * product state with their own lifecycles, and reusing either would tie analytics
 * identity to a 24h persona TTL.
 */

export const ANONYMOUS_ID_KEY = 'tiler_analytics_anonymous_id';
export const ANONYMOUS_ID_COOKIE = 'tlr_aid';
export const SESSION_KEY = 'tiler_analytics_session';
export const SESSION_TIMEOUT_MS = 30 * 60 * 1000;

const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 400;

type StoredSession = {
	id: string;
	lastSeen: number;
};

const newId = (): string => {
	if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
		return crypto.randomUUID();
	}
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
		const r = (Math.random() * 16) | 0;
		return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
	});
};

const readLocal = (key: string): string | null => {
	try {
		return localStorage.getItem(key);
	} catch {
		return null;
	}
};

const writeLocal = (key: string, value: string): void => {
	try {
		localStorage.setItem(key, value);
	} catch {
		// Storage can be unavailable in private modes; identity degrades to per-page.
	}
};

const readCookie = (name: string): string | null => {
	if (typeof document === 'undefined') return null;
	const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
	return match?.[1] ? decodeURIComponent(match[1]) : null;
};

const writeCookie = (name: string, value: string): void => {
	if (typeof document === 'undefined') return;
	const secure = typeof location !== 'undefined' && location.protocol === 'https:';
	document.cookie =
		`${name}=${encodeURIComponent(value)}; path=/; max-age=${COOKIE_MAX_AGE_SECONDS};` +
		` SameSite=Lax${secure ? '; Secure' : ''}`;
};

/**
 * Stable per-visitor id. Mirrored into a first party cookie so it survives a
 * localStorage clear, and so the server can adopt it as an HttpOnly cookie later
 * without changing the client contract (design decision D2).
 */
export const getAnonymousId = (): string => {
	const stored = readLocal(ANONYMOUS_ID_KEY);
	if (stored) {
		writeCookie(ANONYMOUS_ID_COOKIE, stored);
		return stored;
	}

	const fromCookie = readCookie(ANONYMOUS_ID_COOKIE);
	if (fromCookie) {
		writeLocal(ANONYMOUS_ID_KEY, fromCookie);
		return fromCookie;
	}

	const id = newId();
	writeLocal(ANONYMOUS_ID_KEY, id);
	writeCookie(ANONYMOUS_ID_COOKIE, id);
	return id;
};

const readSession = (): StoredSession | null => {
	const raw = readLocal(SESSION_KEY);
	if (!raw) return null;

	try {
		const parsed = JSON.parse(raw) as StoredSession;
		if (typeof parsed?.id !== 'string' || typeof parsed?.lastSeen !== 'number') return null;
		return parsed;
	} catch {
		return null;
	}
};

const readOrRefreshSession = (): StoredSession => {
	const now = Date.now();
	const existing = readSession();

	const session: StoredSession =
		existing && now - existing.lastSeen <= SESSION_TIMEOUT_MS
			? { id: existing.id, lastSeen: now }
			: { id: newId(), lastSeen: now };

	writeLocal(SESSION_KEY, JSON.stringify(session));
	return session;
};

/** Current session id, rolling after {@link SESSION_TIMEOUT_MS} of inactivity. */
export const getSessionId = (): string => readOrRefreshSession().id;

/** Slide the inactivity window without needing the id. */
export const touchSession = (): void => {
	readOrRefreshSession();
};
