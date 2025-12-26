/**
 * Safe localStorage utilities with fallback handling
 */

const isLocalStorageAvailable = (): boolean => {
  try {
    const test = '__localStorage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
};

/**
 * Get item from localStorage with type safety
 */
export const getStorageItem = <T = any>(key: string, defaultValue?: T): T | null => {
  if (!isLocalStorageAvailable()) {
    return defaultValue ?? null;
  }

  try {
    const item = localStorage.getItem(key);
    if (item === null) return defaultValue ?? null;
    return JSON.parse(item);
  } catch {
    console.warn(`Failed to parse localStorage item: ${key}`);
    return defaultValue ?? null;
  }
};

/**
 * Set item in localStorage with serialization
 */
export const setStorageItem = <T = any>(key: string, value: T): boolean => {
  if (!isLocalStorageAvailable()) {
    return false;
  }

  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.warn(`Failed to set localStorage item: ${key}`, error);
    return false;
  }
};

/**
 * Remove item from localStorage
 */
export const removeStorageItem = (key: string): boolean => {
  if (!isLocalStorageAvailable()) {
    return false;
  }

  try {
    localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
};

/**
 * Clear all localStorage
 */
export const clearStorage = (): boolean => {
  if (!isLocalStorageAvailable()) {
    return false;
  }

  try {
    localStorage.clear();
    return true;
  } catch {
    return false;
  }
};

/**
 * Get all storage items (filtered by prefix)
 */
export const getStorageItems = (prefix?: string): Record<string, any> => {
  if (!isLocalStorageAvailable()) {
    return {};
  }

  const items: Record<string, any> = {};

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (!prefix || key.startsWith(prefix))) {
      try {
        items[key] = JSON.parse(localStorage.getItem(key) || '');
      } catch {
        items[key] = localStorage.getItem(key);
      }
    }
  }

  return items;
};

/**
 * Check if a key exists in storage
 */
export const hasStorageItem = (key: string): boolean => {
  if (!isLocalStorageAvailable()) {
    return false;
  }

  return localStorage.getItem(key) !== null;
};
