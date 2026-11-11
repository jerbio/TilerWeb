import {
	createContext,
	useCallback,
	useContext,
	useState,
	useSyncExternalStore,
	type ReactNode,
	type SetStateAction,
} from 'react';

export type InvitationState =
	| 'pending'
	| 'resolved'
	| 'saving'
	| 'uncertain'
	| 'checking'
	| 'accepted'
	| 'declined'
	| 'unavailable';

/** Owned by the page, so replacing a card cannot lose a pending write or an uncertain result. */
class InvitationStore {
	private states = new Map<string, InvitationState>();
	private locks = new Set<string>();
	private listeners = new Set<() => void>();
	subscribe = (listener: () => void) => {
		this.listeners.add(listener);
		return () => {
			this.listeners.delete(listener);
		};
	};
	get = (id: string) => this.states.get(id);
	set = (id: string, state: InvitationState) => {
		if (state === this.states.get(id)) return;
		this.states.set(id, state);
		this.listeners.forEach((listener) => listener());
	};
	start = (id: string, state: 'saving' | 'checking') => {
		const current = this.get(id);
		if (
			this.locks.has(id) ||
			current === 'saving' ||
			current === 'checking' ||
			(state === 'saving' && current === 'uncertain')
		)
			return false;
		this.set(id, state);
		return true;
	};
	acquire = (id: string) => {
		if (this.locks.has(id) || ['saving', 'checking', 'uncertain'].includes(this.get(id) ?? ''))
			return false;
		this.locks.add(id);
		return true;
	};
	release = (id: string) => {
		this.locks.delete(id);
	};
}
const MutationContext = createContext<InvitationStore | null>(null);
export function TileShareMutations({ children }: { children: ReactNode }) {
	const [store] = useState(() => new InvitationStore());
	return <MutationContext.Provider value={store}>{children}</MutationContext.Provider>;
}
export function useInvitationStore() {
	const shared = useContext(MutationContext);
	const [local] = useState(() => new InvitationStore());
	return shared ?? local;
}
export function useInvitationMutation(id: string, initial: InvitationState = 'pending') {
	const store = useInvitationStore();
	const state = useSyncExternalStore(store.subscribe, () => store.get(id) ?? initial);
	const setState = useCallback(
		(next: SetStateAction<InvitationState>) =>
			store.set(id, typeof next === 'function' ? next(store.get(id) ?? initial) : next),
		[store, id, initial]
	);
	const start = useCallback(
		(phase: 'saving' | 'checking' = 'saving') => store.start(id, phase),
		[store, id]
	);
	return {
		state,
		setState,
		start,
	};
}
