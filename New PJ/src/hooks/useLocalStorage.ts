import { useState, useEffect, useCallback } from 'react';
import { getStorageItem, setStorageItem, removeStorageItem } from '@/lib/storage';

/**
 * Hook to sync state with localStorage
 */
export const useLocalStorage = <T,>(
  key: string,
  initialValue?: T
): [T | undefined, (value: T | ((val: T | undefined) => T)) => void, () => void] => {
  const [storedValue, setStoredValue] = useState<T | undefined>(() => {
    return getStorageItem<T>(key, initialValue);
  });

  const setValue = useCallback(
    (value: T | ((val: T | undefined) => T)) => {
      try {
        const valueToStore = value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);
        setStorageItem(key, valueToStore);
      } catch (error) {
        console.warn(`Failed to set localStorage value for key: ${key}`, error);
      }
    },
    [key, storedValue]
  );

  const removeValue = useCallback(() => {
    try {
      setStoredValue(undefined);
      removeStorageItem(key);
    } catch (error) {
      console.warn(`Failed to remove localStorage value for key: ${key}`, error);
    }
  }, [key]);

  return [storedValue, setValue, removeValue];
};

export default useLocalStorage;
