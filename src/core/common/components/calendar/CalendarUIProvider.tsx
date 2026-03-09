import { createContext, useContext, useState } from 'react';

export type CalendarUIContextType = {
  isCreateTileModalOpen: boolean;
  setCreateTileModalOpen: (isOpen: boolean) => void;
  isCreateTileModalExpanded: boolean;
  setCreateTileModalExpanded: (isExpanded: boolean) => void;
};

const CalendarUIContext = createContext<CalendarUIContextType | null>(null);

export function CalendarUIProvider({ children, demoMode = false }: { children: React.ReactNode, demoMode?: boolean }) {
  const [isCreateTileModalOpen, _setCreateTileModalOpen] = useState(false);
  const [isCreateTileModalExpanded, _setCreateTileModalExpanded] = useState(false);

  const setCreateTileModalOpen = (isOpen: boolean) => {
		if (demoMode) return;
    _setCreateTileModalOpen(isOpen);
  };

	const setCreateTileModalExpanded = (isExpanded: boolean) => {
    if (demoMode) return;
    _setCreateTileModalExpanded(isExpanded);
  }

  return (
    <CalendarUIContext.Provider
      value={{
        isCreateTileModalOpen,
        setCreateTileModalOpen,
        isCreateTileModalExpanded,
        setCreateTileModalExpanded,
      }}
    >
      {children}
    </CalendarUIContext.Provider>
  );
}

export function useCalendarUI(): CalendarUIContextType {
  const context = useContext(CalendarUIContext);
  if (!context) {
    throw new Error('Calendar UI must be used within a CalendarUIProvider');
  }
  return context;
}
