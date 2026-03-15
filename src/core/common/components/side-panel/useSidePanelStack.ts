import { useState, useCallback } from 'react';
import { SidePanelEntry } from './side_panel_types';

export function useSidePanelStack(initial: SidePanelEntry[]) {
  const [stack, setStack] = useState<SidePanelEntry[]>(initial);

  const push = useCallback(
    (entry: SidePanelEntry) => setStack((prev) => [...prev, entry]),
    []
  );

  const pop = useCallback(
    () => setStack((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev)),
    []
  );

  return { stack, push, pop } as const;
}
