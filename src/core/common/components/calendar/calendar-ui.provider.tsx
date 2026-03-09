import { createContext, useContext, useRef } from 'react';
import { useStore } from 'zustand';
import {
  createCalendarUIStore,
  CalendarUIStore,
} from './calendar-ui.store';

const CalendarUIContext =
  createContext<ReturnType<typeof createCalendarUIStore> | null>(null);

export function CalendarUIProvider({
  children,
  demoMode = false,
}: {
  children: React.ReactNode;
  demoMode?: boolean;
}) {
  const storeRef = useRef<ReturnType<typeof createCalendarUIStore>>();

  if (!storeRef.current) {
    storeRef.current = createCalendarUIStore(demoMode);
  }

  return (
    <CalendarUIContext.Provider value={storeRef.current}>
      {children}
    </CalendarUIContext.Provider>
  );
}

export function useCalendarUI<T>(
  selector: (state: CalendarUIStore) => T
) {
  const store = useContext(CalendarUIContext);

  if (!store) {
    throw new Error('useCalendarUI must be used inside CalendarUIProvider');
  }

  return useStore(store, selector);
}
