import { useEffect, useRef, useCallback } from 'react';

/**
 * Memory-safe setTimeout hook that automatically cancels pending timers on unmount.
 * Prevents "Can't perform a React state update on an unmounted component" errors.
 * 
 * @returns {{ setSafeTimeout: (cb: () => void, delay: number) => number, clearSafeTimeout: (id: number) => void }}
 */
export default function useSafeTimeout() {
  const timersRef = useRef(new Set());

  const clearSafeTimeout = useCallback((timerId) => {
    if (timerId) {
      clearTimeout(timerId);
      timersRef.current.delete(timerId);
    }
  }, []);

  const setSafeTimeout = useCallback((callback, delay = 0) => {
    const timerId = setTimeout(() => {
      timersRef.current.delete(timerId);
      callback();
    }, delay);

    timersRef.current.add(timerId);
    return timerId;
  }, []);

  useEffect(() => {
    const activeTimers = timersRef.current;
    return () => {
      activeTimers.forEach(id => clearTimeout(id));
      activeTimers.clear();
    };
  }, []);

  // Return callable function with properties for both direct invocation and destructuring
  const timeoutFn = (callback, delay) => setSafeTimeout(callback, delay);
  timeoutFn.setSafeTimeout = setSafeTimeout;
  timeoutFn.clearSafeTimeout = clearSafeTimeout;
  timeoutFn.clear = clearSafeTimeout;

  return timeoutFn;
}
