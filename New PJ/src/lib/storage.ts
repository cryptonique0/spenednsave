/**
 * Storage utilities for working with localStorage and sessionStorage
 */

const STORAGE_PREFIX = 'talent_resume_';

/**
 * Check if storage is available
 */
function isStorageAvailable(type: 'localStorage' | 'sessionStorage'): boolean {
  try {
    const storage = window[type];
    const test = '__storage_test__';
    storage.setItem(test, test);
    storage.removeItem(test);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Get item from localStorage
 */
export function getLocalStorage<T>(key: string, defaultValue?: T): T | null {
  if (typeof window === 'undefined' || !isStorageAvailable('localStorage')) {
    return defaultValue ?? null;
  }

  try {
    const item = window.localStorage.getItem(STORAGE_PREFIX + key);
    return item ? JSON.parse(item) : defaultValue ?? null;
  } catch (error) {
    console.error(`Error getting localStorage item "${key}":`, error);
    return defaultValue ?? null;
  }
}

/**
 * Set item in localStorage
 */
export function setLocalStorage<T>(key: string, value: T): boolean {
  if (typeof window === 'undefined' || !isStorageAvailable('localStorage')) {
    return false;
  }

  try {
    window.localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`Error setting localStorage item "${key}":`, error);
    return false;
  }
}

/**
 * Remove item from localStorage
 */
export function removeLocalStorage(key: string): boolean {
  if (typeof window === 'undefined' || !isStorageAvailable('localStorage')) {
    return false;
  }

  try {
    window.localStorage.removeItem(STORAGE_PREFIX + key);
    return true;
  } catch (error) {
    console.error(`Error removing localStorage item "${key}":`, error);
    return false;
  }
}

/**
 * Clear all app items from localStorage
 */
export function clearLocalStorage(): boolean {
  if (typeof window === 'undefined' || !isStorageAvailable('localStorage')) {
    return false;
  }

  try {
    const keys = Object.keys(window.localStorage);
    keys.forEach((key) => {
      if (key.startsWith(STORAGE_PREFIX)) {
        window.localStorage.removeItem(key);
      }
    });
    return true;
  } catch (error) {
    console.error('Error clearing localStorage:', error);
    return false;
  }
}

/**
 * Get item from sessionStorage
 */
export function getSessionStorage<T>(key: string, defaultValue?: T): T | null {
  if (typeof window === 'undefined' || !isStorageAvailable('sessionStorage')) {
    return defaultValue ?? null;
  }

  try {
    const item = window.sessionStorage.getItem(STORAGE_PREFIX + key);
    return item ? JSON.parse(item) : defaultValue ?? null;
  } catch (error) {
    console.error(`Error getting sessionStorage item "${key}":`, error);
    return defaultValue ?? null;
  }
}

/**
 * Set item in sessionStorage
 */
export function setSessionStorage<T>(key: string, value: T): boolean {
  if (typeof window === 'undefined' || !isStorageAvailable('sessionStorage')) {
    return false;
  }

  try {
    window.sessionStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`Error setting sessionStorage item "${key}":`, error);
    return false;
  }
}

/**
 * Remove item from sessionStorage
 */
export function removeSessionStorage(key: string): boolean {
  if (typeof window === 'undefined' || !isStorageAvailable('sessionStorage')) {
    return false;
  }

  try {
    window.sessionStorage.removeItem(STORAGE_PREFIX + key);
    return true;
  } catch (error) {
    console.error(`Error removing sessionStorage item "${key}":`, error);
    return false;
  }
}

/**
 * Clear all app items from sessionStorage
 */
export function clearSessionStorage(): boolean {
  if (typeof window === 'undefined' || !isStorageAvailable('sessionStorage')) {
    return false;
  }

  try {
    const keys = Object.keys(window.sessionStorage);
    keys.forEach((key) => {
      if (key.startsWith(STORAGE_PREFIX)) {
        window.sessionStorage.removeItem(key);
      }
    });
    return true;
  } catch (error) {
    console.error('Error clearing sessionStorage:', error);
    return false;
  }
}
