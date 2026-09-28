import { useState, useEffect } from 'react';

/**
 * Hook to debounce any rapidly changing value (e.g. search input).
 * 
 * @param {any} value - The input value.
 * @param {number} delay - Debounce delay in milliseconds.
 * @returns {any} Debounced value.
 */
export default function useDebounce(value, delay = 250) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
