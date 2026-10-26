import { useEffect } from 'react';
import { useStore } from 'zustand';
import { locationService, type LocationState } from '@/services/locationService';

export function useLocationState<T>(selector: (state: LocationState) => T): T {
	useEffect(() => locationService.initialize(), []);
	return useStore(locationService.store, selector);
}
