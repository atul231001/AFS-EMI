import { useState, useEffect } from 'react';

export function usePersistentState(key, initialValue) {
  const [state, setState] = useState(() => {
    try {
      const stored = localStorage.getItem(`afs_filter_${key}`);
      return stored !== null ? JSON.parse(stored) : initialValue;
    } catch (e) {
      console.warn('Error reading localStorage for key', key, e);
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(`afs_filter_${key}`, JSON.stringify(state));
    } catch (e) {
      console.warn('Error setting localStorage for key', key, e);
    }
  }, [key, state]);

  return [state, setState];
}
