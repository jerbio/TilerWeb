import { useEffect, useState } from 'react';
import { Env } from '@/config/config_getter';

/**
 * Hook to manage development tools overlay
 * Provides keyboard shortcut (Ctrl+Shift+U+F12) to toggle dev overlay
 * Only active in development mode
 */
function useDevTools() {
  const [isOverlayVisible, setIsOverlayVisible] = useState(false);
  const isDevMode = Env.isDevToolsEnabled();

  useEffect(() => {
    if (!isDevMode) return;

    let uPressed = false;
    let timeoutId: number | null = null;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Check for Ctrl+Shift modifier keys
      if (!(event.ctrlKey || event.metaKey) || !event.shiftKey) {
        return;
      }

      // Track U key press
      if (event.key === 'U') {
        event.preventDefault();
        uPressed = true;
        
        // Reset after 2 seconds if F12 isn't pressed
        if (timeoutId) window.clearTimeout(timeoutId);
        timeoutId = window.setTimeout(() => {
          uPressed = false;
        }, 2000);
      }
      
      // Track F12 key press
      if (event.key === 'F12') {
        event.preventDefault();
        
        // If U was already pressed, toggle overlay
        if (uPressed) {
          setIsOverlayVisible((prev) => !prev);
          // Reset state
          uPressed = false;
          if (timeoutId) window.clearTimeout(timeoutId);
        }
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      // Reset if modifier keys are released
      if (!event.ctrlKey && !event.metaKey && !event.shiftKey) {
        uPressed = false;
        if (timeoutId) {
          window.clearTimeout(timeoutId);
          timeoutId = null;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      if (timeoutId) window.clearTimeout(timeoutId);
    };
  }, [isDevMode]);

  const toggleOverlay = () => {
    if (isDevMode) {
      setIsOverlayVisible((prev) => !prev);
    }
  };

  const closeOverlay = () => {
    setIsOverlayVisible(false);
  };

  return {
    isOverlayVisible,
    toggleOverlay,
    closeOverlay,
    isDevMode,
  };
}

export default useDevTools;
