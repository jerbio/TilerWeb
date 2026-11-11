import { useState } from 'react';

/** Ignore the old global preference: a Class must never change a Project's starting view. */
export function useSharePreference<T extends string>(
	key: string,
	allowed: readonly T[],
	fallback: T
) {
	const read = (): T => {
		try {
			const stored = window.localStorage.getItem(key);
			return allowed.find((value) => value === stored) ?? fallback;
		} catch {
			return fallback;
		}
	};
	const [selection, setSelection] = useState(() => ({ key, value: read() }));
	const value = selection.key === key ? selection.value : read();
	const select = (next: T) => {
		if (!allowed.includes(next)) return;
		setSelection({ key, value: next });
		try {
			window.localStorage.setItem(key, next);
		} catch {
			/* Storage may be disabled. */
		}
	};
	return [value, select] as const;
}

export function sharePreferenceKey(
	userId: string | null,
	clusterId: string,
	mode: string,
	owner: boolean
) {
	return `tileshare.experience.v1:${encodeURIComponent(userId ?? 'anonymous')}:${encodeURIComponent(clusterId)}:${mode}:${owner ? 'owner' : 'participant'}`;
}
