import { useEffect } from 'react';

/**
 * Hook to execute a callback when the Escape key is pressed.
 * 
 * @param {() => void} onEscape - Callback invoked on Escape press.
 * @param {boolean} [isActive=true] - Whether the listener should be attached.
 */
export default function useEscapeKey(onEscape, isActive = true) {
  useEffect(() => {
    if (!isActive || typeof onEscape !== 'function') return;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onEscape();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onEscape, isActive]);
}
