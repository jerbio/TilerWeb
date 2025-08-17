const STORAGE_KEY = 'chat_session_id';

export const getStoredSessionId = (): string | null =>
  localStorage.getItem(STORAGE_KEY);

export const setStoredSessionId = (sessionId: string): void =>
  localStorage.setItem(STORAGE_KEY, sessionId);

export const clearStoredSessionId = (): void =>
  localStorage.removeItem(STORAGE_KEY);
